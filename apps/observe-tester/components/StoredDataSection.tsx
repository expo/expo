import { Observe } from 'expo-observe';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import StorageInspector, { type StoredData } from '@/modules/storage-inspector';
import { useTheme } from '@/utils/theme';

// Reads `clientId` outside compiler-memoized render expressions, before it inspects the storage.
function readStoredData(): (StoredData & { clientId: string | null }) | null {
  const clientId = Observe.clientId;
  const data = StorageInspector?.inspect();
  return data ? { ...data, clientId } : null;
}

// Shows the stored Observe data as text with test IDs, so the consent tests can read it on a
// simulator.
export function StoredDataSection() {
  const theme = useTheme();
  const [data, setData] = useState(readStoredData);

  if (StorageInspector == null || data == null) {
    return null;
  }

  const rows: [string, string | number | boolean | null][] = [
    ['databaseExists', data.databaseExists],
    ['legacyStoreExists', data.legacyStoreExists],
    ['crashFileCount', data.crashFileCount],
    ['pendingErrorFileCount', data.pendingErrorFileCount],
    ['installationIdStored', data.installationIdStored],
    ['appMetricsSettingsKeys', data.appMetricsSettingsKeys],
    ['appMetricsSettingsFileExists', data.appMetricsSettingsFileExists],
    ['observeSettingsKeys', data.observeSettingsKeys],
    ['observeSettingsFileExists', data.observeSettingsFileExists],
    ['clientId', data.clientId],
  ];

  return (
    <>
      <Text style={[styles.sectionTitle, { color: theme.text.default }]}>Stored data</Text>
      {rows.map(([name, value]) => (
        <Text key={name} testID={`stored-data-${name}`} style={{ color: theme.text.default }}>
          {name}: {String(value)}
        </Text>
      ))}
      <Button
        title="Refresh stored data"
        onPress={() => setData(readStoredData())}
        theme="secondary"
      />
      <Button
        title="Grant consent"
        onPress={async () => {
          await Observe.setConsent('granted');
          setData(readStoredData());
        }}
        theme="secondary"
      />
      <Button
        title="Revoke consent"
        onPress={async () => {
          await Observe.setConsent('not-granted');
          setData(readStoredData());
        }}
        theme="secondary"
      />
      <Button
        title="Log consent-test event and dispatch"
        onPress={async () => {
          Observe.logEvent('consent-test');
          await Observe.dispatchEvents();
          setData(readStoredData());
        }}
        theme="secondary"
      />
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
});
