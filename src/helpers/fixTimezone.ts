function fixTimezone (date: Date, options?: { add: boolean }) {
  const isServer = process.env.SERVER === 'true'
  const now = new Date()
  const timezoneInMinutes = now.getTimezoneOffset()
  const timezoneInHours = timezoneInMinutes / 60
  const timezoneBrazil = timezoneInHours - 3
  const timezoneBrazilInMS = timezoneBrazil * 60 * 60 * 1000

  if (!isServer) {
    return
  }
  if (options?.add === true) {
    date.setTime(date.getTime() + timezoneBrazilInMS)
  } else {
    date.setTime(date.getTime() - timezoneBrazilInMS)
  }
  return date
}

export default fixTimezone
