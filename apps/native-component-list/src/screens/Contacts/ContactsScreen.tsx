import { Platform } from '@unimodules/core';
import { usePermissions } from '@use-expo/permissions';
import * as Contacts from 'expo-contacts';
import * as Permissions from 'expo-permissions';
import React from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';

import HeaderIconButton, { HeaderContainerRight } from '../../components/HeaderIconButton';
import * as ContactUtils from './ContactUtils';
import ContactsList from './ContactsList';

const CONTACT_PAGE_SIZE = 500;

export default function ContactsScreen({ navigation }: { navigation: any }) {
  const [permission] = usePermissions(Permissions.CONTACTS, { ask: true });

  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <Text>No Contact Permission</Text>
      </View>
    );
  }

  return <ContactsView navigation={navigation} />;
}

function ContactsView({ navigation }: { navigation: any }) {
  let rawContacts: Record<string, Contacts.Contact> = {};

  const [contacts, setContacts] = React.useState<Contacts.Contact[]>([]);
  const [hasNextPage, setHasNextPage] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const onPressItem = React.useCallback(
    (id: string) => {
      navigation.navigate('ContactDetail', { id });
    },
    [navigation]
  );

  const loadAsync = async (event: { distanceFromEnd?: number } = {}, restart = false) => {
    if (!hasNextPage || refreshing || Platform.OS === 'web') {
      return;
    }
    setRefreshing(true);

    const pageOffset = restart ? 0 : contacts.length || 0;

    const pageSize = restart ? Math.max(pageOffset, CONTACT_PAGE_SIZE) : CONTACT_PAGE_SIZE;

    const payload = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.Name],
      sort: Contacts.SortTypes.LastName,
      pageSize,
      pageOffset,
    });

    const { data: nextContacts } = payload;

    if (restart) {
      rawContacts = {};
    }

    for (const contact of nextContacts) {
      rawContacts[contact.id] = contact;
    }
    setContacts(Object.values(rawContacts));
    setHasNextPage(payload.hasNextPage);
    setRefreshing(false);
  };

  React.useEffect(() => {
    loadAsync();
  }, []);

  return (
    <ContactsList
      onEndReachedThreshold={-1.5}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => loadAsync({}, true)} />
      }
      data={contacts}
      onPressItem={onPressItem}
      onEndReached={loadAsync}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    marginVertical: 10,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactRow: {
    marginBottom: 12,
  },
});

ContactsScreen.navigationOptions = () => {
  return {
    title: 'Contacts',
    headerRight: (
      <HeaderContainerRight>
        <HeaderIconButton
          disabled={Platform.select({ web: true, default: false })}
          name="md-add"
          onPress={() => {
            const randomContact = { note: 'Likes expo...' } as Contacts.Contact;
            ContactUtils.presentNewContactFormAsync({ contact: randomContact });
          }}
        />
      </HeaderContainerRight>
    ),
  };
};
