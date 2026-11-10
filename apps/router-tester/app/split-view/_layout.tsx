// Manual test screen for the SplitView header and toolbar options. The back button shows only when the split view is collapsed.
import { useRouter } from 'expo-router';
import {
  SplitView,
  type SplitViewHeader,
  type SplitViewToolbarItem,
} from 'expo-router/unstable-split-view';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import type { SplitHostCommands } from 'react-native-screens/experimental';

import {
  COLUMN_NAMES,
  ColumnScreen,
  OptionButton,
  SplitViewTesterContext,
  type Column,
} from '@/components/split-view';

const DEFAULT_TOGGLES = {
  sidebar: true,
  supplementary: true,
  content: true,
  inspector: true,
  title: true,
  subtitle: false,
  largeTitle: false,
  titleColor: false,
  largeTitleColor: false,
  searchBar: false,
  hidden: false,
  leftToolbar: true,
  rightToolbar: true,
  tintColor: false,
  separateBackground: false,
  hidesSharedBackground: false,
  accessibility: false,
  disabled: false,
  selected: false,
  backTitle: false,
  backVisible: true,
  showSupplementary: true,
  showInspector: false,
};
type Toggle = keyof typeof DEFAULT_TOGGLES;

const CYCLES = {
  icon: ['SF Symbol', 'xcasset', 'none'],
  iconRenderingMode: ['default', 'template', 'original'],
  badge: ['none', 'dot', 'value', 'styled'],
  variant: ['plain', 'done', 'prominent'],
  backButtonDisplayMode: ['default', 'generic', 'minimal'],
  horizontalSafeAreaInsets: ['expanded', 'always', 'never'],
  displayMode: [
    'automatic',
    'secondaryOnly',
    'oneBesideSecondary',
    'oneOverSecondary',
    'twoBesideSecondary',
    'twoOverSecondary',
    'twoDisplaceSecondary',
  ],
} as const;
type Cycle = keyof typeof CYCLES;

const ICONS = {
  'SF Symbol': 'bolt',
  xcasset: { xcasset: 'expo-logo' },
  none: undefined,
} satisfies Record<(typeof CYCLES.icon)[number], SplitViewToolbarItem['icon']>;

const BADGES = {
  none: undefined,
  dot: {},
  value: { value: 3 },
  styled: {
    value: 'New',
    style: {
      color: 'white',
      backgroundColor: 'green',
      fontFamily: 'Menlo',
      fontSize: 10,
      fontWeight: 'bold',
    },
  },
} satisfies Record<(typeof CYCLES.badge)[number], SplitViewToolbarItem['badge']>;

export default function Layout() {
  const router = useRouter();
  const [split, setSplit] = useState<SplitHostCommands | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [toggles, setToggles] = useState(DEFAULT_TOGGLES);
  const [cycles, setCycles] = useState<Record<Cycle, number>>({
    icon: 0,
    iconRenderingMode: 0,
    badge: 0,
    variant: 0,
    backButtonDisplayMode: 0,
    horizontalSafeAreaInsets: 0,
    displayMode: 0,
  });
  const [press, setPress] = useState({ title: '', count: 0 });
  const [lastSearchChange, setLastSearchChange] = useState('None');
  const [lastSearchSubmit, setLastSearchSubmit] = useState('None');
  const [checked, setChecked] = useState(false);

  const value = <K extends Cycle>(key: K): (typeof CYCLES)[K][number] => CYCLES[key][cycles[key]];
  const iconRenderingMode = value('iconRenderingMode');

  const header = (column: Column): SplitViewHeader | undefined => {
    if (!toggles[column]) {
      return undefined;
    }
    const name = COLUMN_NAMES[column];
    const onPress = (title: string) => () =>
      setPress((p) => ({ title: `${name} ${title}`, count: p.count + 1 }));
    const action: SplitViewToolbarItem = {
      title: `${name} action`,
      icon: ICONS[value('icon')],
      iconRenderingMode: iconRenderingMode === 'default' ? undefined : iconRenderingMode,
      tintColor: toggles.tintColor ? 'orange' : undefined,
      badge: BADGES[value('badge')],
      variant: value('variant'),
      separateBackground: toggles.separateBackground,
      hidesSharedBackground: toggles.hidesSharedBackground,
      accessibilityLabel: toggles.accessibility ? `${name} custom label` : undefined,
      accessibilityHint: toggles.accessibility ? 'Custom hint' : undefined,
      disabled: toggles.disabled,
      selected: toggles.selected,
      onPress: onPress('action'),
    };
    const menu: SplitViewToolbarItem = {
      title: `${name} menu`,
      icon: 'ellipsis.circle',
      menu: {
        title: 'Menu title',
        items: [
          {
            title: 'Checkmark',
            isOn: checked,
            onPress: () => {
              setChecked((c) => !c);
              onPress('checkmark')();
            },
          },
          { title: 'Disabled', disabled: true, onPress: onPress('disabled') },
          { title: 'Delete', icon: 'trash', destructive: true, onPress: onPress('delete') },
        ],
      },
    };
    return {
      title: toggles.title ? name : undefined,
      subtitle: toggles.subtitle ? `${name} subtitle` : undefined,
      largeTitle: toggles.largeTitle,
      titleStyle: toggles.titleColor ? { color: 'red' } : undefined,
      largeTitleStyle: toggles.largeTitleColor ? { color: 'blue' } : undefined,
      searchBar: toggles.searchBar
        ? {
            placeholder: `Search ${name.toLowerCase()}`,
            onChangeText: (e) => setLastSearchChange(`${name} "${e.nativeEvent.text}"`),
            onSearchButtonPress: (e) => setLastSearchSubmit(`${name} "${e.nativeEvent.text}"`),
          }
        : undefined,
      hidden: toggles.hidden,
      leftToolbar: toggles.leftToolbar
        ? [{ title: `${name} left`, icon: 'star', onPress: onPress('left') }]
        : undefined,
      rightToolbar: toggles.rightToolbar ? [action, menu] : undefined,
      backButtonDisplayMode: value('backButtonDisplayMode'),
      backTitle: toggles.backTitle ? 'Custom back' : undefined,
      backVisible: toggles.backVisible,
    };
  };

  const toggleRow = (key: Toggle, name: string) => (
    <OptionButton
      key={key}
      label={`Toggle ${name}`}
      value={toggles[key] ? 'On' : 'Off'}
      onPress={() => setToggles((t) => ({ ...t, [key]: !t[key] }))}
    />
  );
  const cycleRow = (key: Cycle, name: string) => (
    <OptionButton
      key={key}
      label={`Cycle ${name}`}
      value={value(key)}
      onPress={() => setCycles((c) => ({ ...c, [key]: (c[key] + 1) % CYCLES[key].length }))}
    />
  );

  return (
    <SplitViewTesterContext
      value={{
        show: (column) => split?.show(column),
        hasSupplementary: toggles.showSupplementary,
        collapsed,
        lastPress: press.count ? `${press.title} (${press.count})` : 'None',
        lastSearchChange,
        lastSearchSubmit,
      }}>
      <SplitView
        ref={setSplit}
        preferredDisplayMode={value('displayMode')}
        horizontalSafeAreaInsets={value('horizontalSafeAreaInsets')}
        topColumnForCollapsing="primary"
        showInspector={toggles.showInspector}
        onInspectorHide={() => setToggles((t) => ({ ...t, showInspector: false }))}
        onCollapse={() => setCollapsed(true)}
        onExpand={() => setCollapsed(false)}>
        <SplitView.Column header={header('sidebar')}>
          <ColumnScreen column="sidebar">
            <OptionButton label="Back to home" onPress={() => router.replace('/')} />
            <Text style={styles.section}>Columns with header options</Text>
            {toggleRow('sidebar', 'sidebar header')}
            {toggleRow('supplementary', 'supplementary header')}
            {toggleRow('content', 'content header')}
            {toggleRow('inspector', 'inspector header')}
            <Text style={styles.section}>Header</Text>
            {toggleRow('title', 'title text')}
            {toggleRow('subtitle', 'subtitle')}
            {toggleRow('largeTitle', 'large title text')}
            {toggleRow('titleColor', 'title color')}
            {toggleRow('largeTitleColor', 'large title color')}
            {toggleRow('searchBar', 'search bar')}
            {toggleRow('hidden', 'hidden header')}
            <Text style={styles.section}>Toolbars</Text>
            {toggleRow('leftToolbar', 'left toolbar')}
            {toggleRow('rightToolbar', 'right toolbar')}
            <Text style={styles.section}>Action item</Text>
            {cycleRow('icon', 'icon')}
            {cycleRow('iconRenderingMode', 'icon rendering mode')}
            {toggleRow('tintColor', 'tint color')}
            {cycleRow('badge', 'badge')}
            {cycleRow('variant', 'variant')}
            {toggleRow('separateBackground', 'separate background')}
            {toggleRow('hidesSharedBackground', 'hide shared background')}
            {toggleRow('accessibility', 'custom accessibility')}
            {toggleRow('disabled', 'disabled action')}
            {toggleRow('selected', 'selected action')}
            <Text style={styles.section}>Back button</Text>
            {cycleRow('backButtonDisplayMode', 'back button display mode')}
            {toggleRow('backTitle', 'back title')}
            {toggleRow('backVisible', 'back button visible')}
            <Text style={styles.section}>Split view</Text>
            {cycleRow('horizontalSafeAreaInsets', 'horizontal safe area insets')}
            {cycleRow('displayMode', 'display mode')}
            {toggleRow('showSupplementary', 'supplementary column')}
            {toggleRow('showInspector', 'inspector column')}
          </ColumnScreen>
        </SplitView.Column>
        {toggles.showSupplementary && (
          <SplitView.Column header={header('supplementary')}>
            <ColumnScreen column="supplementary" />
          </SplitView.Column>
        )}
        <SplitView.Content header={header('content')} />
        <SplitView.Inspector header={header('inspector')}>
          <ColumnScreen column="inspector" />
        </SplitView.Inspector>
      </SplitView>
    </SplitViewTesterContext>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 16, fontSize: 13, color: 'gray', textTransform: 'uppercase' },
});
