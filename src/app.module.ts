import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';
import { BOT_NAME } from './app.constants';
import { BotModule } from './bot/bot.module';

@Module({
  imports: [
    // ✅ Environment
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    // ✅ PostgreSQL ulanishi
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.PG_HOST,
      port: Number(process.env.PG_PORT),
      username: process.env.PG_USER,
      password: process.env.PG_PASSWORD,
      database: process.env.PG_DATABASE,
      autoLoadModels: true,
      synchronize: true,
      logging: false,
      sync: { alter: true }
    }),

    // ✅ Telegram bot moduli (session bilan)
    TelegrafModule.forRootAsync({
      botName: BOT_NAME,
      useFactory: () => ({
        token: process.env.TELEGRAM_BOT_TOKEN!,
        middlewares: [session()], // 🟢 Session middleware shu yerda
      }),
    }),

    // ✅ Bot moduli
    BotModule,
  ],
})
export class AppModule { }