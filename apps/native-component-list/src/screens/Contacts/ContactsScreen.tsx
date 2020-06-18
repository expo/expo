import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Platform } from '@unimodules/core';
import { usePermissions } from '@use-expo/permissions';
import * as Contacts from 'expo-contacts';
import * as Permissions from 'expo-permissions';
import React from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';

import HeaderIconButton, { HeaderContainerRight } from '../../components/HeaderIconButton';
import ContactsList from './ContactsList';
import * as ContactUtils from './ContactUtils';

type StackParams = {
  ContactDetail: { id: string };
};

const CONTACT_PAGE_SIZE = 500;

export default function ContactsScreen({
  navigation,
}: {
  navigation: StackNavigationProp<StackParams>;
}) {
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

function ContactsView({ navigation }: { navigation: StackNavigationProp<StackParams> }) {
  let _rawContacts: Record<string, Contacts.Contact> = {};

  const [contacts, setContacts] = React.useState<Contacts.Contact[]>([]);
  const [hasPreviousPage, setHasPreviousPage] = React.useState<boolean>(true);
  const [hasNextPage, setHasNextPage] = React.useState<boolean>(true);
  const [refreshing, setRefreshing] = React.useState<boolean>(false);

  const onPressItem = React.useCallback(
    (id: string) => {
      // tslint:disable-next-line no-console
      navigation.navigate('ContactDetail', { id });
    },
    [navigation]
  );

  const loadAsync = async (
    { distanceFromEnd }: { distanceFromEnd?: number } = {},
    restart = false
  ) => {
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
      _rawContacts = {};
    }

    for (const contact of nextContacts) {
      _rawContacts[contact.id] = contact;
    }
    setContacts(Object.values(_rawContacts));
    setHasPreviousPage(payload.hasPreviousPage);
    setHasNextPage(payload.hasNextPage);
    setRefreshing(false);
  };

  useFocusEffect(() => {
    loadAsync();
  });

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

function AddContactHeaderButton() {
  return (
    <HeaderIconButton
      name="md-add"
      onPress={async () => {
        const randomContact = { note: 'Likes expo...' };
        // @ts-ignore
        ContactUtils.presentNewContactFormAsync({ contact: randomContact });
        // ContactUtils.presentUnknownContactFormAsync({
        //   contact: randomContact,
        // });
      }}
    />
  );
}

ContactsScreen.navigationOptions = () => {
  return {
    title: 'Contacts',
    headerRight: Platform.select<any>({
      web: () => null,
      default: () => (
        <HeaderContainerRight>
          <AddContactHeaderButton />
        </HeaderContainerRight>
      ),
    }),
  };
};
