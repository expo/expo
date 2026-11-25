import { useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

import { Avatar, contactBackground, findContact, fullName } from '@/components/split-view-contacts';

const ACTIONS: { title: string; icon: SFSymbol }[] = [
  { title: 'message', icon: 'message.fill' },
  { title: 'call', icon: 'phone.fill' },
  { title: 'video', icon: 'video.fill' },
  { title: 'mail', icon: 'envelope.fill' },
];

export default function ContactScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [lastAction, setLastAction] = useState<{ id: string; title: string }>();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const contact = findContact(id);
  if (!contact) {
    return <Text>Contact not found</Text>;
  }
  const name = fullName(contact);
  return (
    <ScrollView
      testID="split-view-contacts-card"
      style={{ backgroundColor: contactBackground(id) }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}>
      <Pressable
        accessibilityRole="button"
        style={styles.edit}
        onPress={() =>
          Alert.prompt(
            'Edit Notes',
            name,
            (note) => setNotes((values) => ({ ...values, [id]: note })),
            'plain-text',
            notes[id]
          )
        }>
        <Text style={styles.label}>Edit</Text>
      </Pressable>
      <View style={styles.header}>
        <Avatar contact={contact} size={200} />
        <Text style={styles.name}>{name}</Text>
        {contact.company && <Text style={styles.footer}>{contact.company}</Text>}
      </View>
      <View style={styles.actions}>
        {ACTIONS.map(({ title, icon }) => (
          <Pressable
            key={title}
            accessibilityRole="button"
            accessibilityLabel={title}
            style={styles.action}
            onPress={() => setLastAction({ id, title })}>
            <SymbolView name={icon} size={22} tintColor="white" />
          </Pressable>
        ))}
      </View>
      {lastAction?.id === id && <Text style={styles.footer}>Last action: {lastAction.title}</Text>}
      <View style={[styles.card, styles.notes]}>
        <Text style={styles.label}>Notes</Text>
        <Text style={styles.footer}>{notes[id] || `Path: /split-view-contacts/${id}`}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        style={styles.card}
        onPress={() => Share.share({ message: `${name}\n${contact.phone}\n${contact.email}` })}>
        <Text style={styles.label}>Share Contact</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        style={styles.card}
        onPress={() => setLastAction({ id, title: 'Add as Downtime Contact' })}>
        <Text style={styles.label}>Add as Downtime Contact</Text>
      </Pressable>
      <View style={styles.card}>
        <Text style={styles.footer}>mobile</Text>
        <Text style={styles.label}>{contact.phone}</Text>
        <Text style={styles.footer}>email</Text>
        <Text style={styles.label}>{contact.email}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 8,
  },
  edit: {
    alignSelf: 'flex-end',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  header: { alignItems: 'center', gap: 8, paddingTop: 10 },
  name: { fontSize: 28, fontWeight: '700', color: 'white', textAlign: 'center' },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 8 },
  action: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  card: {
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  notes: { minHeight: 108 },
  label: { fontSize: 16, color: 'white' },
  footer: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
});
