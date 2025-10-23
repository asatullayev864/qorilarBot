import { Ctx, Hears, InjectBot, On, Start, Update } from "nestjs-telegraf";
import { Context, Telegraf, Markup } from "telegraf";
import { BotService } from "./bot.service";
import { BOT_NAME } from "../app.constants";

interface SessionData { step?: "ism" | "phone" | "daily"; full_name?: string; phone?: string; }
interface MyContext extends Context { session?: SessionData; }

@Update()
export class BotUpdate {
  constructor(
    private readonly botService: BotService,
    @InjectBot(BOT_NAME) private readonly bot: Telegraf<MyContext>,
  ) { }

  @Start()
  async onStart(@Ctx() ctx: MyContext) {
    const username = ctx.from?.username || '';
    const fullName = ctx.from?.first_name || "do'st";

    const isRegistered = await this.botService.existsByUsername(username);

    if (isRegistered) {
      await ctx.reply(
        `👋 Assalomu alaykum, ${fullName}!\n\nSiz allaqachon ro'yxatdan o'tgan ekansiz ✅\n\nQuyidagi menyudan birini tanlang:`,
        Markup.keyboard([
          ["📘 Bugungi o'qiganini kiritish"],
          ["📊 Statistikani ko'rish"],
        ]).resize(),
      );
      return;
    }

    await ctx.reply(
      `👋 Assalomu alaykum, ${fullName}!\n\n` +
      `Bu bot orqali siz "Qorilar" jamoasiga a'zo bo'lishingiz mumkin.\n\n` +
      `➡️ A'zo bo'lish uchun: /azobolish`,
    );
  }

  @On("contact")
  async onContact(@Ctx() ctx: MyContext) {
    await this.botService.onContact(ctx);
  }

  @Hears("/azobolish")
  async azobolish(@Ctx() ctx: MyContext) {
    ctx.session = { step: "ism" };
    await ctx.reply("Ismingizni to'liq kiriting:");
  }

  @Hears("📘 Bugungi o'qiganini kiritish")
  async onDailyRead(@Ctx() ctx: MyContext) {
    ctx.session = { step: "daily" };
    await ctx.reply("📖 Bugun nechta sahifa o'qidingiz?");
  }

  @Hears("📊 Statistikani ko'rish")
  async onStats(@Ctx() ctx: MyContext) {
    const stats = await this.botService.getStats(ctx.from?.username || "");
    await ctx.replyWithHTML(stats);
    // Statistika ko'rsatib bo'lgach ham menyu qayta chiqadi
    await ctx.reply("👇 Quyidagilardan birini tanlang:", Markup.keyboard([
      ["📘 Bugungi o'qiganini kiritish"],
      ["📊 Statistikani ko'rish"],
    ]).resize());
  }

  @On("text")
  async onText(@Ctx() ctx: MyContext) {
    const text = ctx.message?.['text'];
    if (!text) return;

    ctx.session ??= {};

    // === DAILY STEP ===
    if (ctx.session.step === "daily") {
      const pages = parseInt(text, 10);
      if (isNaN(pages) || pages <= 0) {
        await ctx.reply("❌ Iltimos, musbat raqam kiriting.");
        return;
      }

      const msg = await this.botService.saveDailyRead(ctx.from?.username || "", pages);

      await ctx.reply(msg || "✅ Ma’lumot saqlandi!");

      await ctx.reply(
        "Quyidagilardan birini tanlang 👇",
        Markup.keyboard([
          ["📘 Bugungi o'qiganini kiritish"],
          ["📊 Statistikani ko'rish"],
        ]).resize(),
      );

      ctx.session = {};
      return;
    }


    // === ISM STEP ===
    if (ctx.session.step === "ism") {
      const full_name = text.trim();
      if (!full_name) {
        await ctx.reply("❌ Ism bo'sh bo'lmasligi kerak. Qaytadan kiriting:");
        return;
      }

      ctx.session.full_name = full_name;
      ctx.session.step = "phone";

      await ctx.replyWithHTML(
        "<b>📞 Iltimos, telefon raqamingizni yuboring</b>",
        Markup.keyboard([
          [Markup.button.contactRequest("📞 Telefon raqamni yuborish")],
        ])
          .resize()
          .oneTime(),
      );

      return;
    }

    // === PHONE STEP ===
    if (ctx.session.step === "phone") {
      const phone = text.trim();
      if (!phone.match(/^\+?\d{10,12}$/)) {
        await ctx.reply("❌ Telefon raqami noto'g'ri formatda. Qaytadan kiriting:");
        return;
      }
      ctx.session.phone = phone;

      const msg = await this.botService.addQori(
        ctx.session.full_name ?? '',
        ctx.from?.username || "no_username",
        ctx.session.phone ?? ''
      );

      await ctx.reply(msg, Markup.keyboard([
        ["📘 Bugungi o'qiganini kiritish"],
        ["📊 Statistikani ko'rish"],
      ]).resize());

      ctx.session = {};
    }
  }

  @Hears("/qorilar")
  async getQorilar(@Ctx() ctx: MyContext) {
    const qorilarList = await this.botService.getAllQorilar();
    await ctx.reply(qorilarList);
  }

}