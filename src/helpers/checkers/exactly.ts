/**
 * Executes command if the message body matches exactly the trigger
 * @param body Message to be body checked
 * @param string String to be looked for in the message
 */
function exactly(body: string, string: string) {
	return body.trim() === string;
}

export default exactly;
