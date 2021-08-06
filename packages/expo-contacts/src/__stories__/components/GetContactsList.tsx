import * as Contacts from 'expo-contacts';
import { Button } from 'expo-stories/components';
import * as React from 'react';

import { ContactCard } from './ContactCard';

type GetContactsListProps = {
  query?: Contacts.ContactQuery;
};

export function GetContactsList({ query }: GetContactsListProps) {
  const [contacts, setContacts] = React.useState([]);
  const [didFetch, setDidFetch] = React.useState(false);

  async function onGetContactsPress() {
    const fetchedContacts = await Contacts.getContactsAsync(query);
    setContacts(fetchedContacts.data);
    setDidFetch(true);
  }

  async function onResetPress() {
    setContacts([]);
    setDidFetch(false);
  }

  return (
    <>
      <>
        {contacts.map(contact => (
          <ContactCard key={contact.id} contact={contact} />
        ))}
      </>
      <Button
        onPress={didFetch ? onResetPress : onGetContactsPress}
        label={didFetch ? 'Reset' : 'Get Contacts'}
        variant={didFetch ? 'secondary' : 'primary'}
      />
    </>
  );
}
