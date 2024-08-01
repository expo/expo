import { StyleSheet } from 'react-native';
import { Tabs, TabList, TabSlot, TabTrigger } from 'expo-router/headless';
import { TabButton } from '../components/TabButton';

export default function Layout() {
  return (
    <Tabs style={styles.root}>
      <TabSlot />
      <TabList style={styles.tabList}>
        <TabTrigger href="/" asChild style={styles.tabTrigger}>
          <TabButton icon="home">Index</TabButton>
        </TabTrigger>
        <TabTrigger asChild href="/styles" style={styles.tabTrigger}>
          <TabButton icon="paint-brush">Style Libraries</TabButton>
        </TabTrigger>
        <TabTrigger asChild href="http://www.google.com" style={styles.tabTrigger}>
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
