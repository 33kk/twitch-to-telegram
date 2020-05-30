import Dictionary from "./dictionary";

export type Config = {
    telegram_notification_bot_token: string;
    channels: Dictionary<string>;
    telegram_bot_tokens: string[];
    ignored_users: string[];
    regex_message_filters: string[];
}