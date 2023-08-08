export function capString(string: string, maxLength: number): string {
  if (string.length <= maxLength) {
    return string;
  }
  return string.substring(0, maxLength - 3) + '...';
}
