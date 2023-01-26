export function msToLengthStr(ms) {
	const d = new Date(Date.UTC(0, 0, 0, 0, 0, 0, ms));

	const h = d.getUTCHours();
	const m = d.getUTCMinutes();
	const s = d.getUTCSeconds();

	const hStr = h > 0 ? h + 'h ' : '';
	const mStr = m > 0 || h > 0 ? m + 'm ' : '';
	const sStr = s + 's';

	return `${hStr}${mStr}${sStr}`;
}
