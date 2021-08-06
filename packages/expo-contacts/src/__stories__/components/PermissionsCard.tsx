import * as Contacts from 'expo-contacts';
import { Button, Json } from 'expo-stories/components';
import * as React from 'react';

export function PermissionsCard() {
  const [status, setStatus] = React.useState({});

  async function getPermissions() {
    const status = await Contacts.getPermissionsAsync();
    setStatus(status);
  }

  React.useEffect(() => {
    getPermissions();
  }, []);

  async function onRequestPermissions() {
    await Contacts.requestPermissionsAsync();
    await getPermissions();
  }

  return (
    <>
      <Button onPress={onRequestPermissions} label="Request Contact Permissions" />
      <Json json={status} />
    </>
  );
}
