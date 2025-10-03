import { use } from 'react';
import { Button, Text, View } from 'react-native';

import { ActiveTabsContext } from '../utils/active-tabs-context';

export default function Tab() {
  const { activeTabs, setActiveTabs } = use(ActiveTabsContext);
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Tab 1</Text>
      <Button
        title="Remove Tab 1"
        onPress={() => setActiveTabs(activeTabs.filter((t) => t !== 'tab-1'))}
      />
    </View>
  );
}
