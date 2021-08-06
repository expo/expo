//  @todo - add ios platform examples for contacts

import * as Contacts from 'expo-contacts';
import { Container } from 'expo-stories/components';
import * as React from 'react';

import {
  IsAvailableCard,
  PermissionsCard,
  AddContactView,
  GetContactByIdView,
  GetContactsList,
  UpdateContactView,
  PresentFormView,
  WriteContactsToFileView,
} from './components';

export function PermissionsExamples() {
  return (
    <>
      <Container labelTop="Getting isAvailable">
        <IsAvailableCard />
      </Container>
      <Container labelTop="Requesting Permissions">
        <PermissionsCard />
      </Container>
    </>
  );
}

PermissionsExamples.storyConfig = {
  name: 'Requesting Permissions',
};

export function AddContactsExample() {
  return (
    <>
      <Container labelTop="Adding and removing a contact with first and last name">
        <AddContactView contact={{ firstName: 'Andy', lastName: 'Smith' }} />
      </Container>

      <Container labelTop="Adding and removing a contact with a nickname">
        <AddContactView contact={{ nickname: 'Joe', firstName: 'Andy', lastName: 'Smith' }} />
      </Container>
    </>
  );
}

AddContactsExample.storyConfig = {
  name: 'Adding and Removing Contacts',
};

export function GetContactsExample() {
  return (
    <>
      <Container labelTop="Queries 2 contacts">
        <GetContactsList query={{ pageSize: 2 }} />
      </Container>
      <Container labelTop="Queries a single contact by id">
        <GetContactByIdView />
      </Container>
    </>
  );
}

GetContactsExample.storyConfig = {
  name: 'Getting Contacts',
};

export function UpdateContactsExample() {
  return (
    <>
      <Container labelTop="Updates contact's last name">
        <UpdateContactView
          initialContact={{ firstName: 'Andy', lastName: '123' }}
          updates={{ lastName: 'Wow' }}
        />
      </Container>
      <Container labelTop="Presents form to update contact">
        <PresentFormView initialContact={{ firstName: 'Andrew', lastName: 'Smith' }} />
      </Container>
    </>
  );
}

UpdateContactsExample.storyConfig = {
  name: 'Updating Contacts',
};

export function WriteContactsToFileExample() {
  return (
    <>
      <Container labelTop="Provides a shareable contacts file">
        <WriteContactsToFileView
          contactToShare={{ firstName: 'Hello', lastName: 'Joe' }}
          query={{ fields: [Contacts.Fields.FirstName] }}
        />
      </Container>
    </>
  );
}

WriteContactsToFileExample.storyConfig = {
  name: 'Sharing Contacts',
};

export default {
  title: 'Contacts',
};
