export default function getMsUntilNow(oldDate: Date) {
  return new Date().getTime() - oldDate.getTime();
}
