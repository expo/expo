import { Button, ConfirmationDialog, Form, Host, Section, Text } from '@expo/ui/swift-ui';
import { foregroundStyle } from '@expo/ui/swift-ui/modifiers';
import React, { useState } from 'react';

export default function ConfirmationDialogScreen() {
  const [showBasic, setShowBasic] = useState(false);
  const [showDestructive, setShowDestructive] = useState(false);
  const [showWithMessage, setShowWithMessage] = useState(false);
  const [showHiddenTitle, setShowHiddenTitle] = useState(false);
  const [lastAction, setLastAction] = useState<string>('None');

  return (
    <Host style={{ flex: 1 }}>
      <Form>
        <Section title="Last Action">
          <Text modifiers={[foregroundStyle('secondaryLabel')]}>{lastAction}</Text>
        </Section>

        <Section title="Basic">
          <ConfirmationDialog
            title="Are you sure?"
            isPresented={showBasic}
            onIsPresentedChange={setShowBasic}
            titleVisibility="visible">
            <ConfirmationDialog.Trigger>
              <Button label="Show Basic Dialog" onPress={() => setShowBasic(true)} />
            </ConfirmationDialog.Trigger>
            <ConfirmationDialog.Actions>
              <Button
                label="Confirm"
                onPress={() => {
                  setLastAction('Basic: Confirmed');
                  setShowBasic(false);
                }}
              />
              <Button label="Cancel" role="cancel" />
            </ConfirmationDialog.Actions>
          </ConfirmationDialog>
        </Section>

        <Section title="Destructive Action">
          <ConfirmationDialog
            title="Delete Item?"
            isPresented={showDestructive}
            onIsPresentedChange={setShowDestructive}
            titleVisibility="visible">
            <ConfirmationDialog.Trigger>
              <Button
                label="Delete Item"
                role="destructive"
                onPress={() => setShowDestructive(true)}
              />
            </ConfirmationDialog.Trigger>
            <ConfirmationDialog.Actions>
              <Button
                label="Delete"
                role="destructive"
                onPress={() => {
                  setLastAction('Destructive: Deleted');
                  setShowDestructive(false);
                }}
              />
              <Button label="Cancel" role="cancel" />
            </ConfirmationDialog.Actions>
            <ConfirmationDialog.Message>
              <Text>This action cannot be undone.</Text>
            </ConfirmationDialog.Message>
          </ConfirmationDialog>
        </Section>

        <Section title="With Message">
          <ConfirmationDialog
            title="Save Changes?"
            isPresented={showWithMessage}
            onIsPresentedChange={setShowWithMessage}
            titleVisibility="visible">
            <ConfirmationDialog.Trigger>
              <Button label="Show Dialog with Message" onPress={() => setShowWithMessage(true)} />
            </ConfirmationDialog.Trigger>
            <ConfirmationDialog.Actions>
              <Button
                label="Save"
                onPress={() => {
                  setLastAction('With Message: Saved');
                  setShowWithMessage(false);
                }}
              />
              <Button
                label="Discard"
                role="destructive"
                onPress={() => {
                  setLastAction('With Message: Discarded');
                  setShowWithMessage(false);
                }}
              />
              <Button label="Cancel" role="cancel" />
            </ConfirmationDialog.Actions>
            <ConfirmationDialog.Message>
              <Text>You have unsaved changes. What would you like to do?</Text>
            </ConfirmationDialog.Message>
          </ConfirmationDialog>
        </Section>

        <Section title="Hidden Title">
          <ConfirmationDialog
            title="This title is hidden"
            isPresented={showHiddenTitle}
            onIsPresentedChange={setShowHiddenTitle}
            titleVisibility="hidden">
            <ConfirmationDialog.Trigger>
              <Button label="Show Dialog (Hidden Title)" onPress={() => setShowHiddenTitle(true)} />
            </ConfirmationDialog.Trigger>
            <ConfirmationDialog.Actions>
              <Button
                label="OK"
                onPress={() => {
                  setLastAction('Hidden Title: OK');
                  setShowHiddenTitle(false);
                }}
              />
              <Button label="Cancel" role="cancel" />
            </ConfirmationDialog.Actions>
            <ConfirmationDialog.Message>
              <Text>The title above is hidden via titleVisibility.</Text>
            </ConfirmationDialog.Message>
          </ConfirmationDialog>
        </Section>
      </Form>
    </Host>
  );
}

ConfirmationDialogScreen.navigationOptions = {
  title: 'ConfirmationDialog',
};
