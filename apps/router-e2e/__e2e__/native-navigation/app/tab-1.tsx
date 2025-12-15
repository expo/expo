import { use } from 'react';
import { Button, Text, View } from 'react-native';

import { ActiveTabsContext } from '../utils/active-tabs-context';

export default function Tab() {
  const { activeTabs, setActiveTabs } = use(ActiveTabsContext);
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Tab 1</Text>
      {activeTabs.map((tab) => (
        <Button
          key={tab}
          title={`Remove ${tab}`}
          onPress={() => setActiveTabs(activeTabs.filter((t) => t !== tab))}
        />
      ))}
    </View>
  );
}
