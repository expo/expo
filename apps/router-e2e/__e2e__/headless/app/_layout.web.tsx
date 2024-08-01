import * as stylex from '@stylexjs/stylex';
import { Tabs, TabList, TabSlot, TabTrigger } from 'expo-router/headless';
import { TabButton } from '../components/TabButton';
import { stylexProps } from '../stylex-compat';

const mediaQuery = {
  sm: '@media (max-width: 800px)',
};

export default function Layout() {
  return (
    <Tabs {...stylexProps(styles.root)}>
      <TabSlot />
      <TabList {...stylexProps(styles.tabList)}>
        <TabTrigger href="/" asChild {...stylexProps(styles.tabTrigger)}>
          <TabButton icon="home">Index</TabButton>
        </TabTrigger>
        <TabTrigger asChild href="/styles" {...stylexProps(styles.tabTrigger)}>
          <TabButton icon="paint-brush">Style Libraries</TabButton>
        </TabTrigger>
        <TabTrigger asChild href="http://www.google.com" {...stylexProps(styles.tabTrigger)}>
          <TabButton icon="google">Google</TabButton>
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

const styles = stylex.create({
  root: {
    backgroundColor: '#DDDDDD',
    flex: 1,
    flexDirection: {
      default: 'column',
      [mediaQuery.sm]: 'row-reverse',
    },
  },
  tabList: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    flexDirection: {
      default: 'row',
      [mediaQuery.sm]: 'column',
    },
    gap: 20,
    justifyContent: {
      default: 'space-between',
      [mediaQuery.sm]: 'flex-start',
    },
    paddingHorizontal: {
      default: 30,
      [mediaQuery.sm]: 5,
    },
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
