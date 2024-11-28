import { Tabs, TabSlot, TabList, TabTrigger } from 'expo-router/ui';
import { StyleSheet } from 'react-native';

import { TabButton } from '../../../components/TabButton';

export default function NewTabsLayout() {
  return (
    <Tabs style={styles.root}>
      <TabList style={styles.tabList}>
        <TabTrigger asChild name="thumbs-up" href="./(one)/thumbs-up">
          <TabButton icon="thumbs-up">Up</TabButton>
        </TabTrigger>
        <TabTrigger
          asChild
          name="thumbs-down"
          href={{ pathname: './(two)/[slug]', params: { slug: 'thumbs-down' } }}>
          <TabButton icon="thumbs-down">Down</TabButton>
        </TabTrigger>
      </TabList>
      <TabSlot style={styles.slot} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
  },
  tabList: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    gap: 5,
  },
  slot: {
    flex: 1,
  },
});
