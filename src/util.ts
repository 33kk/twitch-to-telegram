export function getCurrentSecondCount(): number {
	return Math.floor(Number(new Date()) / 1000);
}

export function getCurrentMinuteCount(): number {
	return Math.floor(getCurrentSecondCount() / 60);
}

export function getCurrentHourCount(): number {
	return Math.floor(getCurrentMinuteCount() / 60);
}

export async function sleep(time: number): Promise<void> {
	return new Promise(resolve => {
		setTimeout(resolve, time);
	});
}
