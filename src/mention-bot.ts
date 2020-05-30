import TelegramBot from "./telegram-bot";
import Dictionary from "./dictionary";
import { readFileSync, existsSync, writeFileSync } from "fs";
import { writeFile } from "fs/promises";

const chars = "(?:\\!|\\@|\\#|\\&|\\*|\\(|\\)|\\+|\\-|\\\"|\\,|\\.|\\?|$| )";

export default class MentionBot {
	bot: TelegramBot;
	notificationDb: Dictionary<string[]> = {};
	needToSave = false;
	dbPath: string;
	constructor(token: string, dbPath: string) {
		this.dbPath = dbPath;
		this.bot = new TelegramBot(token);
		if (!existsSync(dbPath)) {
			writeFileSync(dbPath, "{}", "utf-8")
		}
		this.notificationDb = JSON.parse(readFileSync(dbPath, "utf-8"));
		this.bot.bot.start((c) => {
			this.bot.sendMessage(c.chat.id.toString(), "la mia Pepega");
		});
		this.bot.bot.command("add", (ctx) => {
			const args = ctx.message.text.slice(5).toLowerCase();
			if (/^[_A-Za-z0-9]{4,}$/.test(args)) {
				if (!this.notificationDb[ctx.chat.id] || this.notificationDb[ctx.chat.id].length <= 2) {
					if (!this.notificationDb[ctx.chat.id]) {
						this.notificationDb[ctx.chat.id] = [];
						this.needToSave = true;
					}
					if (!this.notificationDb[ctx.chat.id].includes(`usr$${args}`)) {
						this.notificationDb[ctx.chat.id].push(`usr$${args}`);
						this.needToSave = true;
						this.bot.sendMessage(ctx.chat.id.toString(), "Ok");
					}
					else {
						this.bot.sendMessage(ctx.chat.id.toString(), "Already exists");
					}
				}
				else {
					this.bot.sendMessage(ctx.chat.id.toString(), "You can only have two entries.");
				}
			}
			else {
				this.bot.sendMessage(ctx.chat.id.toString(), "Only valid twitch usernames are allowed!");
			}
		});
		this.bot.bot.command("list", (ctx) => {
			if (this.notificationDb[ctx.chat.id]) {
				this.bot.sendMessage(ctx.chat.id.toString(), this.notificationDb[ctx.chat.id].join("\n"));
			}
			else {
				this.bot.sendMessage(ctx.chat.id.toString(), "Nothing found.");
			}
		});
		this.bot.bot.command("remove", (ctx) => {
			const args = ctx.message.text.slice(7);
			if (this.notificationDb[ctx.chat.id]) {
				for (let i = 0; i < this.notificationDb[ctx.chat.id].length; i++) {
					if (this.notificationDb[ctx.chat.id][i] === args) {
						this.notificationDb[ctx.chat.id].splice(i, 1);
						this.bot.sendMessage(ctx.chat.id.toString(), "Ok");
						this.needToSave = true;
						break;
					}
				}
			}
			else {
				this.bot.sendMessage(ctx.chat.id.toString(), "Nothing to remove.");
			}
		});
		this.bot.bot.startPolling();
		setInterval(async () => {
			if (this.needToSave) {
				console.log("Saved notification db");
				await writeFile(this.dbPath, JSON.stringify(this.notificationDb), "utf-8");
				this.needToSave = false;
			}
		}, 60000);
	}
	checkAndNotify(channel: string, user: string, formattedMessage: string, message: string): void {
		for (const chatId in this.notificationDb) {
			for (let rgx of this.notificationDb[chatId]) {
				if (rgx.startsWith("usr$")) {
					rgx = `(?:#.*?@.*?:.*?@?)${chars}${rgx.slice(4)}${chars}`;
				}
				const regex = new RegExp(rgx, "gi");
				if (regex.test(`${channel}@${user}: ${message}`)) {
					this.bot.sendMessage(chatId, formattedMessage, true, false);
					break;
				}
			}
		}
	}
}