import { Telegraf, Context } from "telegraf";
import { sleep } from "./util";
import RateLimiter from "./rate-limiter";


export type Message = {
	chatId: string;
	message: string;
	isHtml: boolean;
	isGroup: boolean;
}

export default class TelegramBot {
	bot: Telegraf<Context>;
	queue: Message[] = [];
	ratelimiter: RateLimiter;
	constructor(token: string) {
		this.bot = new Telegraf(token);
		this.ratelimiter = new RateLimiter({
			rules: {
				overall: {
					time: 1,
					limit: 30,
					createTimestamp: (time): number => {
						return Math.floor(time / 1000); // one timestamp per second
					}
				},
				telegramDM: {
					time: 1,
					limit: 1,
					createTimestamp: (time): number => {
						return Math.floor(time / 1000); // one timestamp per second
					}
				},
				telegramGroup: {
					time: 60,
					limit: 20,
					createTimestamp: (time): number => {
						return Math.floor(time / 1000); // one timestamp per second
					}
				}
			},
			cleanupAfter: 100
		});
		(async(): Promise<void> => {
			for (;;) {
				const message = this.queue.pop();
				if (message) {
					if (message.isGroup) {
						while (this.ratelimiter.isLimited({ overall: undefined, telegramGroup: message.chatId })) {
							sleep(100);
						}
					}
					else {
						while (this.ratelimiter.isLimited({ overall: undefined, telegramDM: message.chatId })) {
							sleep(100);
						}
					}
					if (message.isHtml) {
						// eslint-disable-next-line @typescript-eslint/camelcase
						this.bot.telegram.sendMessage(message.chatId, message.message, { parse_mode: "HTML" });
					}
					else {
						this.bot.telegram.sendMessage(message.chatId, message.message);
					}
				}
				await sleep(25);
			}
		})();
	}
	sendMessage(chatId: string, message: string, isHtml = false, isGroup = false): void {
		this.queue.push({chatId, message, isHtml, isGroup});
	}
}