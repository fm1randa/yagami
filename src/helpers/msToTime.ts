export default function msToTime(ms: number) {
	let seconds = Number((ms / 1000).toFixed(1));
	let minutes = Number((ms / (1000 * 60)).toFixed(1));
	let hours = Number((ms / (1000 * 60 * 60)).toFixed(1));
	let days = Number((ms / (1000 * 60 * 60 * 24)).toFixed(1));
	if (seconds < 60) return seconds + " sec";
	else if (minutes < 60) return minutes + " min";
	else if (hours < 24) return hours + " hrs";
	else return days + " days";
}
