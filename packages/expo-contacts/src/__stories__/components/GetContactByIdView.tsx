import * as Contacts from 'expo-contacts';
import { Button } from 'expo-stories/components';
import * as React from 'react';

import { ContactCard } from './ContactCard';

type GetContactByIdViewProps = {
  id?: string;
  fields?: Contacts.FieldType[];
};

export function GetContactByIdView({ id, fields }: GetContactByIdViewProps) {
  const [contact, setContact] = React.useState<Contacts.Contact | null>(null);
  const [didFetch, setDidFetch] = React.useState(false);

  async function onGetContactsPress() {
    if (!id) {
      const fetchedContacts = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.ID],
        pageSize: 1,
      });

      const [contact] = fetchedContacts.data;
      id = contact.id;
    }

    const fetchedContact = await Contacts.getContactByIdAsync(id, fields);
    setContact(fetchedContact);
    setDidFetch(true);
  }

  async function onResetPress() {
    setContact(null);
    setDidFetch(false);
  }

  return (
    <>
      <ContactCard contact={contact} />
      <Button
        onPress={didFetch ? onResetPress : onGetContactsPress}
        label={didFetch ? 'Reset' : 'Get Contact'}
        variant={didFetch ? 'secondary' : 'primary'}
      />
    </>
  );
}
