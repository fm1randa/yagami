import { Client } from "whatsapp-web.js";

async function getChatID(client: Client, number: string) {
	try {
		const numberId = await client.getNumberId(number);
		return numberId._serialized;
	} catch (error) {
		throw new Error(
			`Couldn't find chatID for number ${number}. Make sure the number is registered in Whatsapp or the number is in correct format (+5521987654321).\n\n${error}`
		);
	}
}

export default getChatID;
