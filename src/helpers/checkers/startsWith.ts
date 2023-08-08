/**
 * Executes command if the message body starts with the trigger
 * @param body Message to be body checked
 * @param string String to be looked for in the message
 */
function startsWith(body: string, string: string) {
  return body.trim().split(' ')[0] === string;
}

export default startsWith;
