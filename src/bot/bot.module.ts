import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BotService } from './bot.service';
import { BotUpdate } from './bot.update';
import { Qori } from './models/bot.model';
import { DailyRead } from './models/daily-read.model';

@Module({
  imports: [SequelizeModule.forFeature([Qori, DailyRead])],
  providers: [BotService, BotUpdate],
})
export class BotModule { }