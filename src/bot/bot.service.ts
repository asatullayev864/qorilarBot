import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { InjectBot } from "nestjs-telegraf";
import { Context, Markup, Telegraf } from "telegraf";
import { Qori } from "./models/bot.model";
import { DailyRead } from "./models/daily-read.model";
import { BOT_NAME } from "../app.constants";

@Injectable()
export class BotService {
    constructor(
        @InjectModel(Qori) private qoriModel: typeof Qori,
        @InjectModel(DailyRead) private dailyReadModel: typeof DailyRead,
        @InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>,
    ) { }

    async start(ctx: Context) {
        try {
            const username = ctx.from?.username ?? "unknown_user";
            const full_name = `${ctx.from?.first_name ?? ""} ${ctx.from?.last_name ?? ""}`.trim();

            const qori = await this.qoriModel.findOne({ where: { username } });

            if (!qori) {
                await ctx.replyWithHTML(
                    "<b>📞 Iltimos, telefon raqamingizni yuboring</b>",
                    Markup.keyboard([[Markup.button.contactRequest("📞 Telefon raqamni yuborish")]])
                        .resize()
                        .oneTime()
                );
            } else {
                await this.mainMenu(ctx, `👋 Xush kelibsiz, ${qori.full_name}!`);
            }
        } catch (error) {
            console.error("Error on /start:", error);
        }
    }

    async onContact(ctx: Context) {
        try {
            if (!("contact" in ctx.message!)) return;
            const contact = ctx.message.contact;
            const username = ctx.from?.username ?? "unknown_user";
            const full_name = `${ctx.from?.first_name ?? ""} ${ctx.from?.last_name ?? ""}`.trim();

            if (contact.user_id !== ctx.from!.id) {
                return ctx.replyWithHTML(
                    "❗️ Iltimos, o'zingizning telefon raqamingizni yuboring",
                    Markup.keyboard([[Markup.button.contactRequest("📞 Telefon raqamni yuborish")]])
                        .resize()
                        .oneTime()
                );
            }

            const phone = contact.phone_number.startsWith("+")
                ? contact.phone_number
                : "+" + contact.phone_number;

            const existing = await this.qoriModel.findOne({ where: { username } });
            if (existing) {
                return this.mainMenu(ctx, `@${username} siz allaqachon ro'yxatdan o'tgansiz ✅`);
            }

            await this.qoriModel.create({
                full_name,
                username,
                phone_number: phone,
                status: "a'zo",
            });

            await this.mainMenu(
                ctx,
                `🎉 Tabriklaymiz, ${full_name}!\nSiz botga a'zo bo'ldingiz.\n\n👇 Quyidagi tugmalardan birini tanlang:`
            );
        } catch (error) {
            console.error("Error on contact:", error);
        }
    }

    async mainMenu(ctx: Context, text: string) {
        return ctx.replyWithHTML(
            text,
            Markup.keyboard([["📖 Bugun o'qigan sahifam", "📊 Statistikam"]]).resize()
        );
    }

    async saveDailyRead(username: string, pages: number) {
        const qori = await this.qoriModel.findOne({ where: { username } });
        if (!qori) return "❌ Foydalanuvchi topilmadi.";

        await this.dailyReadModel.create({
            qori_id: qori.id,
            pages,
            date: new Date(),
            qori: new Qori
        });

        return `✅ ${pages} sahifa muvaffaqiyatli saqlandi!`;
    }

    async getStats(username: string) {
        const qori = await this.qoriModel.findOne({ where: { username } });
        if (!qori) return "❌ Foydalanuvchi topilmadi.";

        const records = await this.dailyReadModel.findAll({ where: { qori_id: qori.id } });
        const total = records.reduce((sum, r) => sum + r.pages, 0);

        return `<b>📊 Statistika</b>\n\nJami o'qilgan sahifalar: <b>${total}</b>\nKiritilgan kunlar: <b>${records.length}</b>`;
    }

    async existsByUsername(username: string) {
        const user = await this.qoriModel.findOne({ where: { username } });
        return !!user;
    }
    async addQori(full_name: string, username: string, phone_number: string) {
        const newQori = await this.qoriModel.create({
            full_name,
            username,
            phone_number,
            status: "a'zo",
        });
        return `🎉 ${newQori.full_name} botga muvaffaqiyatli qo'shildi!`;
    }

    async getAllQorilar() {
        const qorilar = await this.qoriModel.findAll();
        if (!qorilar.length) return "❌ Hozircha hech kim ro'yxatda yo'q.";
        return qorilar.map(q => `${q.full_name} (@${q.username})`).join("\n");
    }
}