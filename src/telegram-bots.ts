import TelegramBot, { Message }from "./telegram-bot";

export default class TelegramBots {
	bots: TelegramBot[] = [];
	queue: Message[] = [];
	currentBot = 0;
	constructor(tokens: string[]) {
		for (const token of tokens) {
			this.bots.push(new TelegramBot(token));
		}
	}

	sendMessage(chatId: string, message: string, isHtml = false, isGroup = false): void {
		this.currentBot++;
		if (this.currentBot >= this.bots.length) {
			this.currentBot = 0;
		}
		this.bots[this.currentBot].sendMessage(chatId, message, isHtml, isGroup);
	}
}
