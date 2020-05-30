import Dictionary from "./dictionary";

export type RateLimiterConfig = {
	rules?: Dictionary<RateLimiterRule>;
	cleanupAfter?: number;
};

export type RateLimiterRule = {
	limit: number;
	/**
	 * This number will be subtracted from timestamp from timestampFunction
	 */
	time: number;
	/**
	 * @example return Math.floor(Math.floor(time / 1000) / 60) // one timestamp per minute
	 * @example return Math.floor(time / 1000) // one timestamp per second
 	 */
	createTimestamp: (time: number) => number;
};

type RateTimestamp = {
	/**
	 * Timestamp
	 */
	t: number;
	/**
	 * Count
	 */
	c: number;
};

export default class RateLimiter {
	private readonly config: RateLimiterConfig = {};
	private cleanupCounter = 0;
	private store: Dictionary<RateTimestamp[]> = {};
	constructor(config: RateLimiterConfig) {
		this.config = config;
	}

	isLimited(rules: Dictionary<string>, alwaysIncrement = false): boolean {
		const currentTime = Number(new Date());

		if (++this.cleanupCounter >= this.config.cleanupAfter) {
			this.cleanupCounter = 0;
			this.cleanup(currentTime);
		}

		let ratelimited = false;
		for (const rule in rules) {
			const key = this.createKey(rule, rules[rule]);
			const storeValue = this.store[key];
			if (!storeValue) {
				continue;
			}
			const ruleInfo = this.config.rules[rule];
			if (
				this.isRuleRateLimited(
					ruleInfo.createTimestamp(currentTime) - ruleInfo.time,
					ruleInfo.limit,
					storeValue
				)
			) {
				ratelimited = true;
			}
		}

		for (const rule in rules) {
			if (alwaysIncrement || !ratelimited) {
				const key = this.createKey(rule, rules[rule]);
				const ruleInfo = this.config.rules[rule];
				if (!this.store[key]) {
					this.store[key] = [
						{ t: ruleInfo.createTimestamp(currentTime), c: 1 },
					];
				} else if (
					this.store[key][this.store[key].length - 1].t ===
					ruleInfo.createTimestamp(currentTime)
				) {
					this.store[key][this.store[key].length - 1].c++;
				} else {
					this.store[key].push({
						t: ruleInfo.createTimestamp(currentTime),
						c: 1,
					});
				}
			}
		}
		return ratelimited;
	}

	private isRuleRateLimited(
		fromTime: number,
		limit: number,
		storeValue: RateTimestamp[]
	): boolean {
		let count = 0;
		for (let i = storeValue.length - 1; i >= 0; i--) {
			const element = storeValue[i];
			if (element.t >= fromTime) {
				count += element.c;
			} else {
				break;
			}
		}

		return count >= limit;
	}

	private createKey(rule: string, key: string): string {
		return `${rule}:${key ? key : ""}`;
	}

	private cleanup(currentTime: number): void {
		for (const key in this.store) {
			const ruleInfo = this.config.rules[key.slice(0, key.indexOf(":"))];
			const time = ruleInfo.createTimestamp(currentTime) - ruleInfo.time;
			const value = this.store[key];
			let toIndex = undefined;
			for (let i = 0; i < value.length; i++) {
				if (value[i].t < time) {
					toIndex = i;
				}
				else {
					break;
				}
			}
			if (toIndex) {
				value.splice(0, toIndex + 1);
			}
			if (value.length === 0) {
				delete this.store[key];
			}
		}
	}
}