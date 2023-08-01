/**
 * Executes command if the message body matches exactly the trigger
 * @param value Message to be body checked
 * @param expected String to be looked for in the message
 */
function exactly (value: string, expected: string) {
  return value.trim() === expected
}

export default exactly
