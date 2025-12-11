import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import Button from '../../components/Button';
import { Contact } from 'expo-contacts/next';

export default function ContactApiScreen() {
  const [contact, setContact] = useState<Contact | null>(null);
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Contact.requestPermissionsAsync();
  }, []);

  const execute = async (fn: () => Promise<any>) => {
    setLoading(true);
    try {
      const result = await fn();
      setStatus(JSON.stringify(result ?? null, null, 2));
    } catch (error: any) {
      console.error(error);
      setStatus(JSON.stringify({ error: error.message }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    execute(async () => {
      const newContact = await Contact.create({
        givenName: 'Init',
        familyName: 'Contact',
      });
      setContact(newContact);
      return newContact;
    });
  };

  const handlePatchAll = () => {
    execute(async () => {
      if (!contact) {
        return;
      }

      const hardcodedPatch = {
        givenName: 'Hardcoded',
        middleName: 'Static',
        familyName: 'Value',
        phoneticFamilyName: 'Stat-Ik',
        phoneticGivenName: 'Hard-Co-Ded',
        phoneticMiddleName: 'StAtIc',
        prefix: 'Mr.',
        suffix: 'v1.0',
        nickname: 'FixedGuy',
        maidenName: 'Original',
        company: 'Hardcoded Inc.',
        jobTitle: 'Static Tester',
        department: 'Testing Dept',
        phoneticCompanyName: 'Hard-Co-Ded',
        phones: [{ label: 'mobile', number: '+19998887777' }],
        emails: [{ label: 'work', address: 'static@hardcoded.test' }],
        addresses: [
          {
            label: 'home',
            street: '123 Static Blvd',
            city: 'Fixed City',
            region: 'NY',
            postcode: '10001',
            country: 'USA',
          },
        ],
        dates: [{ label: 'birthday', date: { year: '2000', month: '01', day: '01' } }],
        urlAddresses: [{ label: 'portfolio', url: 'https://hardcoded.io' }],
        relations: [{ label: 'manager', name: 'Big Boss' }],
        socialProfiles: [{ service: 'twitter', username: '@hardcoded_user' }],
        imAddresses: [{ service: 'discord', username: 'hardcoded#0000' }],
        extraNames: [{ label: 'nickname', name: 'HardcodedNick' }],
      };

      await contact.patch(hardcodedPatch);
      return hardcodedPatch;
    });
  };

  const handleGetDetails = () => {
    execute(async () => {
      if (!contact) {
        return;
      }
      return await contact.getDetails();
    });
  };

  const handleDelete = () => {
    execute(async () => {
      if (!contact) {
        return;
      }
      await contact.delete();
      setContact(null);
      return null;
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.outputContainer}>
        <ScrollView nestedScrollEnabled>
          <Text style={styles.status}>{loading ? 'Loading...' : status}</Text>
        </ScrollView>
      </View>

      <View style={styles.buttons}>
        <Button title="1. Create Contact" onPress={handleCreate} />
        <Button title="2. Patch Hardcoded Data" onPress={handlePatchAll} disabled={!contact} />
        <Button title="3. Get Details (JSON)" onPress={handleGetDetails} disabled={!contact} />
        <Button title="4. Delete" onPress={handleDelete} disabled={!contact} />
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
  outputContainer: {
    height: 200,
    width: '90%',
    marginBottom: 20,
    backgroundColor: '#f0f0f0',
    padding: 10,
  },
  status: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  buttons: {
    width: '80%',
    gap: 16,
  },
});
