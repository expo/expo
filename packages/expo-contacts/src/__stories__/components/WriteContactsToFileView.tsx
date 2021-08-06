import * as Contacts from 'expo-contacts';
import { Button } from 'expo-stories/components';
import * as React from 'react';
import { Share } from 'react-native';

import { createContact } from '../helpers';
import { ContactCard } from './ContactCard';

type WriteContactsToFileViewProps = {
  contactToShare: Partial<Contacts.Contact>;
  query?: Contacts.ContactQuery;
  description?: string;
};

export function WriteContactsToFileView({ query, contactToShare }: WriteContactsToFileViewProps) {
  const [contact, setContact] = React.useState<Contacts.Contact | null>(null);

  async function onAddContactPress() {
    const contactId = await Contacts.addContactAsync(createContact(contactToShare));
    const result = await Contacts.getContactByIdAsync(contactId);
    setContact(result);
  }

  async function onRemoveContactPress() {
    if (contact.id) {
      await Contacts.removeContactAsync(contact.id);
      setContact(null);
    }
  }

  async function onSharePress() {
    const uri = await Contacts.writeContactToFileAsync(query);
    await Share.share({ url: uri, message: 'Sharing contact' });
  }

  return (
    <>
      <ContactCard contact={contact} />

      {contact && <Button label="Share" onPress={onSharePress} />}

      <Button
        label={contact ? 'Remove Contact' : 'Add Contact'}
        onPress={contact ? onRemoveContactPress : onAddContactPress}
        variant={contact ? 'secondary' : 'primary'}
      />
    </>
  );
}
