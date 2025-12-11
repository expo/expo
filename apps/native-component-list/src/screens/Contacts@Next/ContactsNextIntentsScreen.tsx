import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import Button from '../../components/Button';
import { Contact, ContactAccessButton } from 'expo-contacts/next';

export default function ContactPickersScreen() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  useEffect(() => {
    Contact.requestPermissionsAsync();
  }, []);

  const handlePresentPicker = async () => {
    try {
      const contact = await Contact.presentPicker();
      if (contact) {
        setSelectedContact(contact);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handlePresentCreateForm = async () => {
    try {
      await Contact.presentCreateForm({ givenName: 'PresentCreateForm' });
    } catch (error) {
      console.error(error);
    }
  };

  const handlePresentEditForm = async () => {
    if (!selectedContact) {
      return;
    }
    try {
      await selectedContact.presentEditForm();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAccessPicker = async () => {
    if (Platform.OS === 'ios') {
      try {
        await Contact.presentAccessPicker();
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.status}>
        {selectedContact ? `Selected contact ID: ${selectedContact.id}` : 'No contact selected'}
      </Text>
      <View style={styles.buttons}>
        <Button title="Contact.presentCreateForm()" onPress={handlePresentCreateForm} />
        <Button title="Contact.presentPicker()" onPress={handlePresentPicker} />
        <Button
          title="selectedContact.presentEditForm()"
          onPress={handlePresentEditForm}
          disabled={!selectedContact}
        />
        {Platform.OS === 'ios' && (
          <View>
            <Button title="Contact.presentAccessPicker()" onPress={handleAccessPicker} />
            <View style={{ marginTop: 50 }}>
              <ContactAccessButton query="PresentCreateForm" />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  status: {
    marginBottom: 20,
    fontSize: 16,
  },
  buttons: {
    width: '80%',
    gap: 16,
  },
});
