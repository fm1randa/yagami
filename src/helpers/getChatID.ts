import { type Client } from 'whatsapp-web.js';

async function getChatID(client: Client, number: string) {
  try {
    const numberId = await client.getNumberId(number);
    if (numberId === null) throw new Error('Number not found');
    return numberId.user;
  } catch (error) {
    if (error instanceof Error && error.message === 'Number not found') {
      throw new Error(
        `Couldn't find chatID for number ${number}. Make sure the number is registered in Whatsapp or the number is in correct format (+5521987654321).\n\n${error.message}`
      );
    }
    throw error;
  }
}

export default getChatID;
