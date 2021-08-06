import * as Contacts from 'expo-contacts';
import * as React from 'react';

export function createContact(contact: Partial<Contacts.Contact>): Contacts.Contact {
  // @fix typing for Contacts.Contact -> doesnt need an id to create
  // @ts-ignore
  return {
    contactType: Contacts.ContactTypes.Person,
    ...contact,
  };
}

export function useContact(initialContact: Partial<Contacts.Contact>) {
  const [contact, setContact] = React.useState<Contacts.Contact | null>();

  async function addContactAsync() {
    const contactId = await Contacts.addContactAsync(createContact(initialContact));
    const result = await Contacts.getContactByIdAsync(contactId);
    setContact(result);
  }

  async function removeContactAsync() {
    if (contact.id) {
      await Contacts.removeContactAsync(contact.id);
      setContact(null);
    }
  }

  async function updateContactAsync(updates?: Partial<Contacts.Contact>) {
    if (contact.id) {
      await Contacts.updateContactAsync({
        ...contact,
        ...updates,
      });

      const result = await Contacts.getContactByIdAsync(contact.id);
      setContact(result);
    }
  }

  return {
    contact,
    updateContactAsync,
    addContactAsync,
    removeContactAsync,
  };
}
