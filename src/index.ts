import TwitchChat from "twitch-chat-client";
import { Config } from "./config";
import { readFileSync } from "fs";
import TelegramBots from "./telegram-bots";
import NotificationBot from "./mention-bot";
const config: Config = JSON.parse(readFileSync("./config.json", "utf-8"));

const twitchChannels = [];
for (const twitchChannel in config.channels) {
	twitchChannels.push(twitchChannel);
}

const chat = new TwitchChat(undefined, { channels: twitchChannels});
const telegram = new TelegramBots(config.telegram_bot_tokens);
const notificationBot = new NotificationBot(config.telegram_notification_bot_token, "./mention-db.json");

function processMessage(channel: string, user: string, message: string, isAction = false): void {
	if (config.ignored_users.includes(user)) {
		return;
	}
	for (const rgx of config.regex_message_filters) {
		const regex = new RegExp(rgx, "gi");
		if (regex.test(message)) {
			return;
		}
	}
	const date = new Date();
	const dateString = `${date.getUTCFullYear() < 10 ? "0" + date.getUTCDate() : date.getUTCDate()}.${date.getUTCMonth() < 10 ? "0" + date.getUTCMonth() : date.getUTCMonth()}.${date.getUTCFullYear()} ${date.getUTCHours() < 10 ? "0" + date.getUTCHours() : date.getUTCHours()}:${date.getUTCMinutes() < 10 ? "0" + date.getUTCMinutes() : date.getUTCMinutes()}`;
	const formattedMessage = `<code>${dateString} ${channel}</code>\n&lt;${user}&gt;: ${isAction ? "<i>" : ""}${message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}${isAction ? "</i>" : ""}`;
	if (config.channels[channel] !== undefined) {
		if (config.channels[channel] !== null) {
			telegram.sendMessage(config.channels[channel], formattedMessage, true, true);
		}
		notificationBot.checkAndNotify(channel, user, formattedMessage, message);
	}
}

chat.onPrivmsg((c, u, m) => {
	console.log(`${c} <${u}>: ${m}`);
	processMessage(c, u, m);
});

chat.onAction((c, u, m) => {
	console.log(`${c} <${u}>: ${m}`);
	processMessage(c, u, m, true);
});

chat.onDisconnect((manually, reason) => {
	console.log(`Disconnected ${manually ? "manually " : ""}${reason}`);
});

chat.connect();