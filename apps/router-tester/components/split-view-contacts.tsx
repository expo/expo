import { StyleSheet, Text, View } from 'react-native';

export type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
  phone: string;
  email: string;
  lists: string[];
};

export const LISTS = ['All Contacts', 'Family', 'Work'];

export const MY_CARD: Contact = {
  id: 'morgan-reed',
  firstName: 'Morgan',
  lastName: 'Reed',
  phone: '+1 555 0109',
  email: 'morgan@example.com',
  lists: [],
};

const CONTACTS: Contact[] = [
  MY_CARD,
  {
    id: 'ada-brooks',
    firstName: 'Ada',
    lastName: 'Brooks',
    company: 'Northwind',
    phone: '+1 555 0101',
    email: 'ada@example.com',
    lists: ['Work'],
  },
  {
    id: 'ben-carter',
    firstName: 'Ben',
    lastName: 'Carter',
    phone: '+1 555 0102',
    email: 'ben@example.com',
    lists: ['Family'],
  },
  {
    id: 'clara-diaz',
    firstName: 'Clara',
    lastName: 'Diaz',
    company: 'Contoso',
    phone: '+1 555 0103',
    email: 'clara@example.com',
    lists: ['Work'],
  },
  {
    id: 'dan-carter',
    firstName: 'Dan',
    lastName: 'Carter',
    phone: '+1 555 0104',
    email: 'dan@example.com',
    lists: ['Family'],
  },
  {
    id: 'eve-novak',
    firstName: 'Eve',
    lastName: 'Novak',
    company: 'Fabrikam',
    phone: '+1 555 0105',
    email: 'eve@example.com',
    lists: ['Work'],
  },
  {
    id: 'finn-olsen',
    firstName: 'Finn',
    lastName: 'Olsen',
    phone: '+1 555 0106',
    email: 'finn@example.com',
    lists: [],
  },
  {
    id: 'gina-park',
    firstName: 'Gina',
    lastName: 'Park',
    phone: '+1 555 0107',
    email: 'gina@example.com',
    lists: ['Family'],
  },
  {
    id: 'hugo-wells',
    firstName: 'Hugo',
    lastName: 'Wells',
    company: 'Northwind',
    phone: '+1 555 0108',
    email: 'hugo@example.com',
    lists: ['Work'],
  },
];

export function findContact(id: string) {
  return CONTACTS.find((contact) => contact.id === id);
}

export function fullName(contact: Contact) {
  return `${contact.firstName} ${contact.lastName}`;
}

// Contacts of a list, grouped by the first letter of the last name.
export function contactSections(list: string, query: string) {
  const text = query.trim().toLowerCase();
  const contacts = CONTACTS.filter(
    (c) => (list === LISTS[0] || c.lists.includes(list)) && fullName(c).toLowerCase().includes(text)
  ).sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));
  const sections = new Map<string, Contact[]>();
  for (const contact of contacts) {
    const letter = contact.lastName[0]!.toUpperCase();
    sections.set(letter, [...(sections.get(letter) ?? []), contact]);
  }
  return [...sections];
}

const CONTACT_COLORS: [background: string, avatar: string][] = [
  ['#264052', '#527D97'],
  ['#402F58', '#8B6BB0'],
  ['#592D3D', '#AC6278'],
  ['#214C48', '#408981'],
  ['#624327', '#A27248'],
];

function contactColors(id: string) {
  const hash = [...id].reduce((value, letter) => (value * 31 + letter.charCodeAt(0)) >>> 0, 0);
  return CONTACT_COLORS[hash % CONTACT_COLORS.length]!;
}

export function contactBackground(id: string) {
  return contactColors(id)[0];
}

export function Avatar({ contact, size }: { contact: Contact; size: number }) {
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: contactColors(contact.id)[1],
        },
      ]}
      accessibilityElementsHidden>
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>
        {contact.firstName[0]}
        {contact.lastName[0]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { color: 'white', fontWeight: '600' },
});
