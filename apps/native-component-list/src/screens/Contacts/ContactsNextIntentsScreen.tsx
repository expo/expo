import { Contact, ContactAccessButton, ContactField, requestPermissionsAsync } from 'expo-contacts';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';

import { BodyText } from '../../components/BodyText';
import Button from '../../components/Button';

type DetailsPreset = {
  title: string;
  fields: ContactField[];
};

const DETAILS_PRESETS: DetailsPreset[] = [
  { title: 'phones', fields: [ContactField.PHONES] },
  {
    title: 'fullName, phones, emails',
    fields: [ContactField.FULL_NAME, ContactField.PHONES, ContactField.EMAILS],
  },
  {
    title: 'note, image, thumbnail',
    fields: [ContactField.NOTE, ContactField.IMAGE, ContactField.THUMBNAIL],
  },
];

export default function ContactPickersScreen() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [pickedDetails, setPickedDetails] = useState<string | null>(null);

  useEffect(() => {
    requestPermissionsAsync();
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

  const handlePickDetails = async (fields: ContactField[]) => {
    try {
      const details = await Contact.pickDetails(fields);
      setPickedDetails(JSON.stringify(details, null, 2));
    } catch (error) {
      setPickedDetails(String(error));
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
      await selectedContact.editWithForm();
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
      <BodyText style={styles.status}>
        {selectedContact ? `Selected contact ID: ${selectedContact.id}` : 'No contact selected'}
      </BodyText>
      <View style={styles.buttons}>
        <Button title="Contact.presentCreateForm()" onPress={handlePresentCreateForm} />
        <Button title="Contact.presentPicker()" onPress={handlePresentPicker} />
        {DETAILS_PRESETS.map((preset) => (
          <Button
            key={preset.title}
            title={`Contact.pickDetails(${preset.title})`}
            onPress={() => handlePickDetails(preset.fields)}
          />
        ))}
        {pickedDetails && <BodyText>{pickedDetails}</BodyText>}
        <Button
          title="selectedContact.editWithForm()"
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
