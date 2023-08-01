export default function msToTime (ms: number) {
  const seconds = Number((ms / 1000).toFixed(1))
  const minutes = Number((ms / (1000 * 60)).toFixed(1))
  const hours = Number((ms / (1000 * 60 * 60)).toFixed(1))
  const days = Number((ms / (1000 * 60 * 60 * 24)).toFixed(1))
  if (seconds < 60) return `${seconds} sec`
  else if (minutes < 60) return `${minutes} min`
  else if (hours < 24) return `${hours} hrs`
  else return `${days} days`
}
