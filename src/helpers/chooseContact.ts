import { Client, Contact, Message } from "whatsapp-web.js";
import { AwaitAnswerOptionsType } from "./awaitMessageAnswer";
import { awaitAnswer, describeContact } from "./index";

async function chooseContact(
    client: Client,
    message: Message,
    awaitAnswerOptions?: AwaitAnswerOptionsType
) {
    const toResponse = await awaitAnswer(
        client,
        await message.reply("Qual o nome ou número do contato?"),
        awaitAnswerOptions
    );
    const contacts = await client.getContacts();
    const contactSearch = searchContacts(contacts, toResponse.body);
    if (!contactSearch.length) throw new Error("Contato não encontrado.");
    const contactCount = contactSearch.length;
    const contactList = createContactList(contactSearch);

    const contactChooseMessage = `${contactCount} contatos encontrados. Selecione um:\n${contactList}`;
    const contactChoice = await awaitAnswer(
        client,
        await toResponse.reply(contactChooseMessage),
        awaitAnswerOptions
    );
    const contactChoiceNumber = parseInt(contactChoice.body);
    if (contactChoiceNumber > contactSearch.length)
        throw new Error("Opção inválida.");
    const contact = contactSearch[contactChoiceNumber - 1];
    return {
        contactChoice,
        contact,
    };
}

function searchContacts(contacts: Contact[], search: string) {
    return contacts.filter(
        (contact) =>
            (contact.name &&
                contact.name.toLowerCase().includes(search.toLowerCase())) ||
            (contact.number &&
                contact.number.toLowerCase().includes(search.toLowerCase()))
    );
}

function createContactList(contacts: Contact[]) {
    return contacts
        .map((contact, index) => `${index + 1}: ${describeContact(contact)}`)
        .join("\n");
}

export default chooseContact;
