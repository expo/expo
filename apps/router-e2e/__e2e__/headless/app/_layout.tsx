import { router, Tabs as RNTabs } from 'expo-router';
import { Tabs, TabList, TabSlot, TabTrigger } from 'expo-router/ui';
import React from 'react';
import { StyleSheet } from 'react-native';

import { TabButton } from '../components/TabButton';

const useRNTabs = false;

export default function Layout() {
  if (useRNTabs) {
    return <RNTabs />;
  }

  return (
    <Tabs style={styles.root}>
      <TabSlot />
      <TabList style={styles.tabList}>
        <TabTrigger name="home" href="/" asChild style={styles.tabTrigger}>
          <TabButton icon="home">Index</TabButton>
        </TabTrigger>
        <TabTrigger name="movies" asChild href="/movies" style={styles.tabTrigger}>
          <TabButton icon="film">Movies</TabButton>
        </TabTrigger>
        <TabTrigger name="old-tabs" asChild href="/old-tabs" style={styles.tabTrigger}>
          <TabButton icon="indent">Old Tabs</TabButton>
        </TabTrigger>
        <TabTrigger
          name="google"
          asChild
          href="http://www.google.com"
          style={styles.tabTrigger}
          onLongPress={(event) => {
            event.preventDefault();
            router.navigate('http://expo.dev');
          }}>
          <TabButton icon="google">Google</TabButton>
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
  behaviorRoot: {
    flexDirection: 'row',
  },
  tabList: {
    backgroundColor: '#FFFFFF',
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
