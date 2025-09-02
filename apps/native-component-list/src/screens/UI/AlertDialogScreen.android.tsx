import { AlertDialog, Button } from '@expo/ui/jetpack-compose';
import * as React from 'react';

import { ScrollPage, Section } from '../../components/Page';

const longText =
  'We are in the alert dialog, this is a very long text that should be wrapped in the alert dialog. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

export default function AlertDialogScreen() {
  const [largeDialogVisible, setLargeDialogVisible] = React.useState(false);
  const [smallDialogVisible, setSmallDialogVisible] = React.useState(false);

  return (
    <ScrollPage>
      <Section title="Alert Dialog">
        <Button onPress={() => setLargeDialogVisible(true)}>Open Large Alert Dialog</Button>

        <AlertDialog
          title="Large Alert Dialog"
          text={longText}
          onDismissPressed={() => setLargeDialogVisible(false)}
          onConfirmPressed={() => setLargeDialogVisible(false)}
          confirmButtonText="Confirm"
          dismissButtonText="Dismiss"
          visible={largeDialogVisible}
        />
      </Section>

      <Section title="Small Alert Dialog">
        <Button onPress={() => setSmallDialogVisible(true)}>Open Small Alert Dialog</Button>

        <AlertDialog
          title="Small Alert Dialog"
          text="This is a small alert dialog"
          onDismissPressed={() => setSmallDialogVisible(false)}
          onConfirmPressed={() => setSmallDialogVisible(false)}
          confirmButtonText="Confirm"
          dismissButtonText="Dismiss"
          visible={smallDialogVisible}
        />
      </Section>
    </ScrollPage>
  );
}

AlertDialogScreen.navigationOptions = {
  title: 'AlertDialog',
};
