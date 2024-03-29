import { type Contact } from 'whatsapp-web.js';

function describeContact(contact: Contact) {
  if (contact.isGroup && contact.name !== undefined) {
    return `[G] ${contact.name}`;
  } else {
    return `${contact.name ?? contact.pushname} - ${contact.number}`;
  }
}
export default describeContact;
