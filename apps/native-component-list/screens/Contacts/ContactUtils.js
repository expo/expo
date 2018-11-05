import { Contacts } from 'expo';

export function parseDate({ year, month, day, format }) {
  let nYear = year || new Date().getFullYear();
  // TODO: Evan: add support for calendars: https://github.com/moment/moment/issues/1454
  const date = new Date(nYear, month, day, 0, 0);
  return date;
}

export function parseAddress({ city, country, postalCode, region, street }) {
  const address = [street, city, region, postalCode, country].filter(item => item != '').join(', ');
  return address;
}

export function parseKey(key) {
  return {
    [Contacts.Fields.ID]: 'ID',
    [Contacts.Fields.ContactType]: 'Contact Type',
    [Contacts.Fields.Name]: 'Name',
    [Contacts.Fields.FirstName]: 'First Name',
    [Contacts.Fields.MiddleName]: 'Middle Name',
    [Contacts.Fields.LastName]: 'Last Name',
    [Contacts.Fields.MaidenName]: 'Maiden Name',
    [Contacts.Fields.NamePrefix]: 'Prefix',
    [Contacts.Fields.NameSuffix]: 'Suffix',
    [Contacts.Fields.Nickname]: 'Nickname',
    [Contacts.Fields.PhoneticFirstName]: 'Phonetic First Name',
    [Contacts.Fields.PhoneticMiddleName]: 'Phonetic Middle Name',
    [Contacts.Fields.PhoneticLastName]: 'Phonetic Last Name',
    [Contacts.Fields.Birthday]: 'Birthday',
    [Contacts.Fields.NonGregorianBirthday]: 'Non-Gregorian Birthday',
    [Contacts.Fields.Emails]: 'Email Addresses',
    [Contacts.Fields.PhoneNumbers]: 'Phone Numbers',
    [Contacts.Fields.Addresses]: 'Addresses',
    [Contacts.Fields.SocialProfiles]: 'Social Profiles',
    [Contacts.Fields.InstantMessageAddresses]: 'Instant Message Addresses',
    [Contacts.Fields.UrlAddresses]: 'URL Addresses',
    [Contacts.Fields.Company]: 'Company',
    [Contacts.Fields.JobTitle]: 'Job Title',
    [Contacts.Fields.Department]: 'Department',
    [Contacts.Fields.ImageAvailable]: 'Image Available',
    [Contacts.Fields.Image]: 'Image',
    [Contacts.Fields.RawImage]: 'Raw Image',
    [Contacts.Fields.Note]: 'Note',
    [Contacts.Fields.Dates]: 'Dates',
    [Contacts.Fields.Relationships]: 'Relationships',
  }[key];
}

export function getPrimary(items) {
  if (items) {
    const primary = items.filter(({ isPrimary }) => isPrimary);
    if (primary.length > 0) {
      return primary[0];
    }
    return items[0];
  }
  return null;
}

export async function getGroupWithNameAsync(groupName) {
  const groups = await Contacts.getGroupsAsync({ groupName });
  if (groups && groups.length > 0) {
    return groups[0];
  }
}

export async function cloneAsync(contactId) {
  const contact = await Contacts.getContactByIdAsync(contactId);
  if (contact) {
    await Contacts.addContactAsync(contact);
  }
}

export async function ensureGroupAsync(groupName) {
  const group = await getGroupWithNameAsync(groupName);
  if (!group) {
    const groupId = await Contacts.createGroupAsync(groupName);
    return groupId;
  }
  return group.id;
}

export async function deleteGroupWithNameAsync(groupName) {
  try {
    const group = await getGroupWithNameAsync(groupName);
    if (group) {
      Contacts.removeGroupAsync(group.id);
    }
  } catch ({ message }) {
    console.error(message);
  }
}

export async function removeAllChildrenFromGroupWithNameAsync(groupName) {
  try {
    const groupId = await ensureGroupAsync(groupName);

    const { data: contacts } = await Contacts.getContactsAsync({ groupId });
    await Promise.all(
      contacts.map(contact => Contacts.removeContactFromGroupAsync(contact.id, groupId))
    );
  } catch ({ message }) {
    console.error(message);
  }
}

export async function debugAddFirstContactToGroupAsync() {
  const groupId = await ensureGroupAsync('Expo Contacts');
  const { data: contacts } = await Contacts.getContactsAsync({ pageSize: 1 });
  const contact = contacts[0];
  Contacts.addExistingContactToGroupAsync(contact.id, groupId);
}

export function presentNewContactFormAsync({ contact, options } = {}) {
  return Contacts.presentFormAsync(null, contact, { ...options, isNew: true });
}

export function presentUnknownContactFormAsync({ contact, options } = {}) {
  return Contacts.presentFormAsync(null, contact, { ...options, isNew: false });
}

export function presentContactInfoFormAsync({ contact, options } = {}) {
  return Contacts.presentFormAsync(contact.id, null, { ...options, isNew: false });
}
