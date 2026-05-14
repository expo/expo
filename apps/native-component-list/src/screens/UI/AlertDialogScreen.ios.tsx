import { Alert, Button, Form, Host, Section, Text } from '@expo/ui/swift-ui';
import { foregroundStyle } from '@expo/ui/swift-ui/modifiers';
import React, { useState } from 'react';

export default function AlertDialogScreen() {
  const [showBasic, setShowBasic] = useState(false);
  const [showDestructive, setShowDestructive] = useState(false);
  const [showMultiple, setShowMultiple] = useState(false);
  const [showTitleOnly, setShowTitleOnly] = useState(false);
  const [lastAction, setLastAction] = useState<string>('None');

  return (
    <Host style={{ flex: 1 }}>
      <Form>
        <Section title="Last Action">
          <Text modifiers={[foregroundStyle('secondaryLabel')]}>{lastAction}</Text>
        </Section>

        <Section title="Basic">
          <Alert title="Sign out?" isPresented={showBasic} onIsPresentedChange={setShowBasic}>
            <Alert.Trigger>
              <Button label="Sign out" onPress={() => setShowBasic(true)} />
            </Alert.Trigger>
            <Alert.Actions>
              <Button
                label="Sign Out"
                onPress={() => {
                  setLastAction('Basic: Signed out');
                  setShowBasic(false);
                }}
              />
              <Button label="Cancel" role="cancel" />
            </Alert.Actions>
            <Alert.Message>
              <Text>You will need to sign in again to access your account.</Text>
            </Alert.Message>
          </Alert>
        </Section>

        <Section title="Destructive Action">
          <Alert
            title="Delete account?"
            isPresented={showDestructive}
            onIsPresentedChange={setShowDestructive}>
            <Alert.Trigger>
              <Button
                label="Delete account"
                role="destructive"
                onPress={() => setShowDestructive(true)}
              />
            </Alert.Trigger>
            <Alert.Actions>
              <Button
                label="Delete"
                role="destructive"
                onPress={() => {
                  setLastAction('Destructive: Deleted');
                  setShowDestructive(false);
                }}
              />
              <Button label="Cancel" role="cancel" />
            </Alert.Actions>
            <Alert.Message>
              <Text>
                This permanently deletes your account and all data. This cannot be undone.
              </Text>
            </Alert.Message>
          </Alert>
        </Section>

        <Section title="With Multiple Actions">
          <Alert
            title="Save changes?"
            isPresented={showMultiple}
            onIsPresentedChange={setShowMultiple}>
            <Alert.Trigger>
              <Button label="Save changes" onPress={() => setShowMultiple(true)} />
            </Alert.Trigger>
            <Alert.Actions>
              <Button
                label="Save"
                onPress={() => {
                  setLastAction('Multiple: Saved');
                  setShowMultiple(false);
                }}
              />
              <Button
                label="Discard"
                role="destructive"
                onPress={() => {
                  setLastAction('Multiple: Discarded');
                  setShowMultiple(false);
                }}
              />
              <Button label="Cancel" role="cancel" />
            </Alert.Actions>
            <Alert.Message>
              <Text>You have unsaved changes. Choose what to do with them.</Text>
            </Alert.Message>
          </Alert>
        </Section>

        <Section title="Title Only">
          <Alert title="Saved" isPresented={showTitleOnly} onIsPresentedChange={setShowTitleOnly}>
            <Alert.Trigger>
              <Button label="Show saved" onPress={() => setShowTitleOnly(true)} />
            </Alert.Trigger>
            <Alert.Actions>
              <Button
                label="OK"
                onPress={() => {
                  setLastAction('Title Only: OK');
                  setShowTitleOnly(false);
                }}
              />
            </Alert.Actions>
          </Alert>
        </Section>
      </Form>
    </Host>
  );
}

AlertDialogScreen.navigationOptions = {
  title: 'AlertDialog',
};
