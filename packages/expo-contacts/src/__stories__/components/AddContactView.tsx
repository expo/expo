import * as Contacts from 'expo-contacts';
import { Button } from 'expo-stories/components';
import * as React from 'react';

import { useContact } from '../helpers';
import { ContactCard } from './ContactCard';

type AddContactViewProps = {
  contact: Partial<Contacts.Contact>;
};

export function AddContactView({ contact: initialContact }: AddContactViewProps) {
  const { contact, addContactAsync, removeContactAsync } = useContact(initialContact);

  return (
    <>
      <ContactCard contact={contact} />

      <Button
        onPress={contact ? removeContactAsync : addContactAsync}
        label={contact ? 'Remove Contact' : 'Add Contact'}
        variant={contact ? 'secondary' : 'primary'}
      />
    </>
  );
}
