import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Contacts from 'expo-contacts';
import { Platform } from 'expo-modules-core';
import React from 'react';
import {
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import * as ContactUtils from './ContactUtils';
import ContactsList from './ContactsList';
import Button from '../../components/Button';
import HeaderContainerRight from '../../components/HeaderContainerRight';
import HeaderIconButton from '../../components/HeaderIconButton';
import MonoText from '../../components/MonoText';
import { Colors } from '../../constants';
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
  const searchRef = React.useRef('');
  const [searchByPhone, setSearchByPhone] = React.useState(false);
  const [contacts, setContacts] = React.useState<Contacts.Contact[]>([]);
  const [hasNextPage, setHasNextPage] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [selectedContact, setSelectedContact] = React.useState<Contacts.Contact | null>(null);

  const rawContactsRef = React.useRef<Record<string, Contacts.Contact>>({});

  const onPressItem = React.useCallback(
    (id: string) => {
      navigation.navigate('ContactDetail', { id });
    },
    [navigation]
  );

  const loadAsync = React.useCallback(
    async (restart = false) => {
      if (!restart && (!hasNextPage || refreshing || Platform.OS === 'web')) {
        return;
      }
      setRefreshing(true);

      const pageOffset = restart ? 0 : contacts.length || 0;
      const pageSize = restart ? Math.max(pageOffset, CONTACT_PAGE_SIZE) : CONTACT_PAGE_SIZE;
      const searchQuery = searchRef.current;
      const isPhoneSearch = searchByPhone && searchQuery;

      const searchPayload = isPhoneSearch ? { phoneNumber: searchQuery } : { name: searchQuery };

      const payload = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
        sort: Contacts.SortTypes.LastName,
        pageSize,
        pageOffset,
        ...searchPayload,
      });

      const { data: nextContacts } = payload;

      if (restart) {
        rawContactsRef.current = {};
      }

      for (const contact of nextContacts) {
        rawContactsRef.current[contact.id!] = contact;
      }

      setContacts(Object.values(rawContactsRef.current));
      setHasNextPage(payload.hasNextPage);
      setRefreshing(false);
    },
    [contacts, hasNextPage, refreshing, searchByPhone]
  );

  const triggerSearch = () => {
    loadAsync(true);
  };

  const handleSearchTypeChange = React.useCallback((newValue: boolean) => {
    setSearchByPhone(newValue);
  }, []);

  const handleSearchChange = (text: string) => {
    searchRef.current = text;
  };

  const changeAccess = React.useCallback(async () => {
    await Contacts.presentAccessPickerAsync();
    await loadAsync(true);
  }, []);

  const onFocus = React.useCallback(() => {
    loadAsync();
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
          <RefreshControl refreshing={refreshing} onRefresh={() => loadAsync(true)} />
        }
        data={contacts}
        onPressItem={onPressItem}
        onEndReached={() => loadAsync()}
        ListHeaderComponent={() => (
          <>
            <TouchableOpacity
              onPress={async () => {
                const contact = await Contacts.presentContactPickerAsync();
                setSelectedContact(contact);
              }}>
              <Text style={[styles.selectContactButton]}>Select a contact</Text>
            </TouchableOpacity>

            {selectedContact && <MonoText>{JSON.stringify(selectedContact, null, 2)}</MonoText>}

            <TextInput
              placeholder="Search by..."
              style={styles.searchInput}
              defaultValue={searchRef.current}
              onChangeText={handleSearchChange}
              onSubmitEditing={triggerSearch}
            />

            <View style={styles.switchContainer}>
              <Text>Search by: Name</Text>
              <Switch value={searchByPhone} onValueChange={handleSearchTypeChange} />
              <Text>Or phone</Text>
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
  selectContactButton: {
    margin: 15,
    color: Colors.tintColor,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  searchInput: {
    borderColor: 'gray',
    borderWidth: 1,
    padding: 10,
    margin: 10,
    marginTop: 0,
    borderRadius: 5,
  },
});
