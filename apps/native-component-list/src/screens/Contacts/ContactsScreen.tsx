import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Contacts from 'expo-contacts';
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'expo-modules-core';
import React from 'react';
import { RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import * as ContactUtils from './ContactUtils';
import ContactsList from './ContactsList';
import Button from '../../components/Button';
import HeaderContainerRight from '../../components/HeaderContainerRight';
import HeaderIconButton from '../../components/HeaderIconButton';
import MonoText from '../../components/MonoText';
import { Colors } from '../../constants';
import { optionalRequire } from '../../navigation/routeBuilder';
import usePermissions from '../../utilities/usePermissions';
import { useResolvedValue } from '../../utilities/useResolvedValue';

export const ContactsScreens = [
  {
    name: 'ContactDetail',
    route: 'contact/detail',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./ContactDetailScreen'));
    },
  },
];

type StackParams = {
  ContactDetail: { id: string };
};

type Props = {
  navigation: StackNavigationProp<StackParams>;
};

const CONTACT_PAGE_SIZE = 500;

const handleAddContact = async () => {
  try {
    const destination = new Directory(Paths.document, 'avatars');
    if (!destination.exists) {
      destination.create();
    }

    const randomSeed = Math.floor(Math.random() * 1000);
    const customFileName = new File(destination, `avatar-${randomSeed}.png`);
    const output = await File.downloadFileAsync(
      `https://robohash.org/TestUser${randomSeed}.png?size=200x200&set=set1`,
      customFileName
    );

    const randomContact = {
      note: 'Likes expo...',
      image: {
        uri: output.uri,
      },
    } as Contacts.Contact;

    await ContactUtils.presentNewContactFormAsync({ contact: randomContact });
  } catch (error) {
    console.error(error);
  }
};

export default function ContactsScreen({ navigation }: Props) {
  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Contacts',
      headerRight: () => (
        <HeaderContainerRight>
          <HeaderIconButton
            disabled={Platform.select({ web: true, default: false })}
            name="add"
            onPress={handleAddContact}
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
  let rawContacts: Record<string, Contacts.ExistingContact> = {};

  const [contacts, setContacts] = React.useState<Contacts.ExistingContact[]>([]);
  const [hasNextPage, setHasNextPage] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [selectedContact, setSelectedContact] = React.useState<Contacts.ExistingContact | null>(
    null
  );

  const onPressItem = React.useCallback(
    (id: string) => {
      navigation.navigate('ContactDetail', { id });
    },
    [navigation]
  );

  const loadAsync = async (event: { distanceFromEnd?: number } = {}, restart = false) => {
    if (!restart && (!hasNextPage || refreshing || Platform.OS === 'web')) {
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

  const checkContactsAsync = React.useCallback(async () => {
    try {
      const hasContactsResult = await Contacts.hasContactsAsync();
      alert(`Has contacts: ${hasContactsResult}`);
    } catch (error) {
      alert(`Error checking contacts: ${error}`);
    }
  }, []);

  const changeAccess = React.useCallback(async () => {
    await Contacts.presentAccessPickerAsync();
    await loadAsync({}, true);
  }, []);

  const onFocus = React.useCallback(() => {
    loadAsync();
  }, []);

  React.useEffect(() => {
    const subscription = Contacts.addContactsChangeListener(() => {
      loadAsync({}, true);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useFocusEffect(onFocus);

  return (
    <>
      <Contacts.ContactAccessButton
        query="Apple"
        caption="email"
        ignoredEmails={[]}
        ignoredPhoneNumbers={[]}
        tintColor={Colors.tintColor}
        backgroundColor="#f3f3f3"
        textColor="black"
        style={{ marginTop: 20, height: 50 }}
      />
      {Platform.OS === 'ios' && (
        <Button title="Change access" onPress={changeAccess} style={styles.changeAccessButton} />
      )}
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

            <View style={styles.infoSection}>
              <TouchableOpacity onPress={checkContactsAsync} style={styles.infoButton}>
                <Text style={styles.infoButtonText}>
                  Check if contacts exist (hasContactsAsync)
                </Text>
              </TouchableOpacity>
            </View>
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
  changeAccessButton: {
    margin: 15,
  },
  infoSection: {
    marginTop: 20,
    marginBottom: 10,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  infoButton: {
    backgroundColor: Colors.tintColor,
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  infoButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
});
