export function capString (string: string, maxLength: number): string {
  if (string.length <= maxLength) {
    return string
  }
  return string.substr(0, maxLength - 3) + '...'
}
