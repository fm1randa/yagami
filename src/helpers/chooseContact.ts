import { type Client, type Contact, type Message } from 'whatsapp-web.js'
import { type AwaitAnswerOptionsType } from './awaitMessageAnswer'
import { awaitAnswer, describeContact } from './index'

async function chooseContact (
  client: Client,
  message: Message,
  awaitAnswerOptions?: AwaitAnswerOptionsType
) {
  const toResponse = await awaitAnswer(
    client,
    await message.reply('What is the name or number of the contact?'),
    awaitAnswerOptions
  )
  const contacts = await client.getContacts()
  const contactSearch = searchContacts(contacts, toResponse.body)
  if (contactSearch.length === 0) throw new Error('No contacts found.')
  const contactCount = contactSearch.length
  const contactList = createContactList(contactSearch)

  const contactChooseMessage = `${contactCount} contacts found. Choose one:\n${contactList}`
  const contactChoice = await awaitAnswer(
    client,
    await toResponse.reply(contactChooseMessage),
    awaitAnswerOptions
  )
  const contactChoiceNumber = parseInt(contactChoice.body)
  if (contactChoiceNumber > contactSearch.length) { throw new Error('Invalid option.') }
  const contact = contactSearch[contactChoiceNumber - 1]
  return {
    contactChoice,
    contact
  }
}

function searchContacts (contacts: Contact[], search: string) {
  return contacts.filter(
    (contact) =>
      (contact.name?.toLowerCase()?.includes(search.toLowerCase()) ?? false) ||
      (contact.number?.toLowerCase()?.includes(search.toLowerCase()) ?? false)
  )
}
function createContactList (contacts: Contact[]) {
  return contacts
    .map((contact, index) => `${index + 1}: ${describeContact(contact)}`)
    .join('\n')
}

export default chooseContact
