import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput } from 'react-native';
import {
  Contact,
  ContactField,
  ContactsSortOrder,
  PartialContactDetails,
} from 'expo-contacts/next';
import Button from '../../components/Button';

export default function ContactsManager() {
  const [contacts, setContacts] = useState<PartialContactDetails<[ContactField.FULL_NAME]>[]>([]);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [limit, setLimit] = useState('20');
  const [offset, setOffset] = useState('0');
  const [sort, setSort] = useState<ContactsSortOrder>(ContactsSortOrder.GivenName);

  useEffect(() => {
    const requestPermissions = async () => {
      await Contact.requestPermissionsAsync();
    };
    requestPermissions();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const data = await Contact.getAllDetails([ContactField.FULL_NAME], {
        name: name,
        limit: parseInt(limit) || 20,
        offset: parseInt(offset) || 0,
        sortOrder: sort,
      });
      setContacts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleSort = () => {
    setSort((prev) =>
      prev === ContactsSortOrder.GivenName
        ? ContactsSortOrder.FamilyName
        : ContactsSortOrder.GivenName
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 10, gap: 10, borderBottomWidth: 1, borderColor: '#ccc' }}>
        <TextInput
          style={{ borderWidth: 1, padding: 5 }}
          placeholder="Search name..."
          value={name}
          onChangeText={setName}
        />

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TextInput
            style={{ borderWidth: 1, padding: 5, flex: 1 }}
            value={limit}
            onChangeText={setLimit}
            placeholder="Limit"
            keyboardType="numeric"
          />
          <TextInput
            style={{ borderWidth: 1, padding: 5, flex: 1 }}
            value={offset}
            onChangeText={setOffset}
            placeholder="Offset"
            keyboardType="numeric"
          />
        </View>

        <Button
          title={`Sort: ${sort === ContactsSortOrder.GivenName ? 'First Name' : 'Last Name'}`}
          onPress={toggleSort}
        />

        <Button
          title={loading ? 'Fetching...' : 'Fetch Contacts'}
          onPress={fetchContacts}
          disabled={loading}
        />
      </View>

      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        data={contacts}
        keyExtractor={(item) => item.id || Math.random().toString()}
        renderItem={({ item }) => (
          <Text style={{ padding: 15, borderBottomWidth: 1, borderColor: '#eee' }}>
            {item.fullName}
          </Text>
        )}
        ListEmptyComponent={<Text style={{ padding: 20, textAlign: 'center' }}>No contacts</Text>}
      />
    </View>
  );
}
