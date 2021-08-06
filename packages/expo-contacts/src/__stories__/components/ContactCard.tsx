import { borderRadius, shadows, spacing, lightTheme, LogsIcon } from '@expo/styleguide-native';
import * as Contacts from 'expo-contacts';
import { Toggle, Json } from 'expo-stories/components';
import * as React from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';

type ContactCardProps = {
  contact?: Contacts.Contact;
};

export function ContactCard({ contact }: ContactCardProps) {
  if (!contact) {
    return (
      <View>
        <ContactCardSkeleton />
      </View>
    );
  }

  return (
    <Toggle.Container>
      <View style={styles.cardContainer}>
        <View style={styles.photoNameContainer}>
          <View style={styles.photo}>
            {contact.imageAvailable && (
              <Image source={{ uri: contact.image?.uri }} style={styles.photo} />
            )}
          </View>
          <Text style={styles.name}>{contact.name}</Text>

          <View style={{ flex: 1 }} />

          <Toggle.Button>
            <LogsIcon size={24} color={lightTheme.button.primary.background} />
          </Toggle.Button>
        </View>

        <View style={styles.contactFieldsContainer}>
          <ContactField fieldName="First Name" value={contact.firstName} />
          <ContactField fieldName="Last Name" value={contact.lastName} />
          <ContactField fieldName="Nickname" value={contact.nickname} />
        </View>
      </View>

      <Toggle.Area>
        <Json json={contact} />
      </Toggle.Area>
    </Toggle.Container>
  );
}

function ContactField({ fieldName, value }) {
  if (!value) {
    return null;
  }

  return (
    <View style={styles.contactFieldContainer}>
      <Text style={styles.contactFieldValue}>{value}</Text>
      <View style={styles.contactFieldSeparator} />
      <Text style={styles.contactFieldFieldName}>{fieldName}</Text>
    </View>
  );
}

function ContactCardSkeleton() {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.photoNameContainer}>
        <View style={styles.photo} />
        <View style={{ width: '100%' }}>
          <View style={[styles.skeletonTextLine, { width: '24%' }]} />
          <View style={[styles.skeletonTextLine, { width: '32%' }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: lightTheme.background.default,
    marginVertical: spacing['3'],
    marginHorizontal: spacing['1'],
    padding: spacing['4'],
    borderRadius: borderRadius.large,
    ...shadows.small,
  },
  photoNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: lightTheme.background.quaternary,
    marginRight: spacing['3.5'],
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: lightTheme.text.default,
  },
  skeletonTextLine: {
    height: 3,
    borderRadius: borderRadius.medium,
    backgroundColor: lightTheme.background.quaternary,
    marginVertical: spacing[1.5],
  },
  contactFieldsContainer: {
    marginVertical: spacing[2],
  },
  contactFieldContainer: { marginVertical: spacing[2], paddingHorizontal: spacing[2] },
  contactFieldValue: { fontSize: 16, fontWeight: '400' },
  contactFieldSeparator: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: lightTheme.background.quaternary,
    marginVertical: spacing[1],
  },
  contactFieldFieldName: { fontSize: 11, fontWeight: '200' },
});
