import { Tabs, TabList, TabSlot, TabTrigger } from 'expo-router/ui';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { TabButton } from '../components/TabButton';

export default function Layout() {
  const [showExtraTab, setShowExtraTab] = useState(false);
  return (
    <Tabs style={styles.root}>
      <TabSlot />
      <TabList style={styles.tabList}>
        <TabTrigger name="home" href="/" asChild reset="longPress" style={styles.tabTrigger}>
          <TabButton icon="home">Index</TabButton>
        </TabTrigger>
        <TabTrigger
          name="movies"
          asChild
          href="/movies"
          style={styles.tabTrigger}
          onLongPress={(event) => {
            event.preventDefault();
            setShowExtraTab((state) => !state);
          }}>
          <TabButton icon="paint-brush">Movies (long press to show expo tab)</TabButton>
        </TabTrigger>
        {showExtraTab ? (
          <TabTrigger name="expo" asChild href="http://expo.dev" style={styles.tabTrigger}>
            <TabButton icon="android">Expo</TabButton>
          </TabTrigger>
        ) : null}
        <TabTrigger name="google" asChild href="http://www.google.com" style={styles.tabTrigger}>
          <TabButton icon="google">Google (external)</TabButton>
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#DDDDDD',
    flex: 1,
  },
  tabList: {
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 30,
  },
  tabTrigger: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'column',
    gap: 5,
    padding: 10,
  },
});
