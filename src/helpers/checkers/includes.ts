/**
 * Executes command if the message body includes the trigger
 * @param body Message to be body checked
 * @param text String to be looked for in the message
 */
function includes(body: string, text: string) {
	return body.trim().includes(text);
}

export default includes;
