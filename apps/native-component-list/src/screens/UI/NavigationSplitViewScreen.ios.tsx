import { Button, Host, List, NavigationSplitView, Section, Text } from '@expo/ui/swift-ui';
import { navigationTitle } from '@expo/ui/swift-ui/modifiers';
import * as React from 'react';

export default function NavigationSplitViewScreen() {
  const [selection, setSelection] = React.useState('Inbox');

  return (
    <Host style={{ flex: 1 }}>
      <NavigationSplitView
        sidebar={
          <List>
            <Section title="Mailboxes">
              <Button label="Inbox" onPress={() => setSelection('Inbox')} />
              <Button label="Drafts" onPress={() => setSelection('Drafts')} />
              <Button label="Sent" onPress={() => setSelection('Sent')} />
            </Section>
          </List>
        }
        content={
          <List>
            <Section title={selection}>
              <Text>Welcome to NavigationSplitView</Text>
              <Text>Expo UI weekly update</Text>
            </Section>
          </List>
        }>
        <Text modifiers={[navigationTitle(selection)]}>{selection}</Text>
      </NavigationSplitView>
    </Host>
  );
}

NavigationSplitViewScreen.navigationOptions = {
  title: 'NavigationSplitView',
};
