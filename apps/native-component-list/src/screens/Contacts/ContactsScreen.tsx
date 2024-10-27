import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Contacts from 'expo-contacts';
import { Platform } from 'expo-modules-core';
import React from 'react';
import { RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import * as ContactUtils from './ContactUtils';
import ContactsList from './ContactsList';
import HeaderContainerRight from '../../components/HeaderContainerRight';
import HeaderIconButton from '../../components/HeaderIconButton';
import MonoText from '../../components/MonoText';
import usePermissions from '../../utilities/usePermissions';
import { useResolvedValue } from '../../utilities/useResolvedValue';

type StackParams = {
  ContactDetail: { id: string };
};

type Props = {
  navigation: StackNavigationProp<StackParams>;
};

const CONTACT_PAGE_SIZE = 500;

export default function ContactsScreen({ navigation }: Props) {
  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Contacts',
      headerRight: () => (
        <HeaderContainerRight>
          <HeaderIconButton
            disabled={Platform.select({ web: true, default: false })}
            name="add"
            onPress={() => {
              const randomContact = { note: 'Likes expo...' } as Contacts.Contact;
              ContactUtils.presentNewContactFormAsync({ contact: randomContact });
            }}
          />
        </HeaderContainerRight>
      ),
    });
  }, [navigation]);

  const [isAvailable, error] = useResolvedValue(Contacts.isAvailableAsync);
  const [permission] = usePermissions(Contacts.requestPermissionsAsync);

  const warning = React.useMemo(() => {
    if (error) {
      return `An unknown error occurred while checking the API availability: ${error.message}`;
    } else if (isAvailable === null) {
      return 'Checking availability...';
    } else if (isAvailable === false) {
      return 'Contacts API is not available on this platform.';
    } else if (!permission) {
      return 'Contacts permission has not been granted for this app. Grant permission in the Settings app to continue.';
    } else if (permission) {
      return null;
    }
    return 'Pending user permission...';
  }, [error, permission, isAvailable]);

  if (warning) {
    return (
      <View style={styles.permissionContainer}>
        <Text>{warning}</Text>
      </View>
    );
  }

  return <ContactsView navigation={navigation} />;
}

function ContactsView({ navigation }: Props) {
  let rawContacts: Record<string, Contacts.Contact> = {};

  const [contacts, setContacts] = React.useState<Contacts.Contact[]>([]);
  const [hasNextPage, setHasNextPage] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [selectedContact, setSelectedContact] = React.useState<Contacts.Contact | null>(null);

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
      rawContacts[contact.id!] = contact;
    }
    setContacts(Object.values(rawContacts));
    setHasNextPage(payload.hasNextPage);
    setRefreshing(false);
  };

  const onFocus = React.useCallback(() => {
    loadAsync();
  }, []);

  useFocusEffect(onFocus);

  return (
    <>
      <ContactsList
        onEndReachedThreshold={-1.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadAsync({}, true)} />
        }
        data={contacts}
        onPressItem={onPressItem}
        onEndReached={loadAsync}
        ListHeaderComponent={() => (
          <>
            <TouchableOpacity
              onPress={async () => {
                const contact = await Contacts.presentContactPickerAsync();

                setSelectedContact(contact);
              }}>
              <Text>Select a contact</Text>
            </TouchableOpacity>

            {selectedContact && <MonoText>{JSON.stringify(selectedContact, null, 2)}</MonoText>}
          </>
        )}
      />
    </>
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
