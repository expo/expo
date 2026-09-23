import { ThemeProvider } from 'ThemeProvider';
import {
  ImperativeRoutingQueueBridge,
  RoutingQueueApiContext,
} from 'expo-router/build/global-state/routingQueueContext';
import { NavigationContext, NavigationRouteContext } from 'expo-router/react-navigation';
import { Screens as apiScreens } from 'native-component-list/src/navigation/apiScreens';
import { Screens as componentScreens } from 'native-component-list/src/navigation/componentScreens';
import {
  findApiScreen,
  findComponentScreen,
} from 'native-component-list/src/navigation/screenRegistry';
import React, { useMemo, useState } from 'react';
import {
  AppRegistry,
  PlatformColor,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaFrameContext, SafeAreaInsetsContext } from 'react-native-safe-area-context';

const sections = [
  { title: 'APIs', screens: apiScreens },
  { title: 'Components', screens: componentScreens },
];

const allScreens = sections.flatMap((section) => section.screens);

const NO_INSETS = { top: 0, right: 0, bottom: 0, left: 0 };

/**
 * Maps an Expo Router href from a native-component-list `Link`, such as `/apis/haptics` or
 * `/components/image/comparison`, back to the registry screen it points at.
 */
function screenForHref(href) {
  const path = String(href).split(/[?#]/)[0].replace(/^\/+/, '');
  const [tab, ...rest] = path.split('/');
  const id = rest.join('/');
  if (tab === 'apis') return findApiScreen(id);
  if (tab === 'components') return findComponentScreen(id);
  return undefined;
}

function titleOf(screen) {
  return screen.options?.title ?? screen.name;
}

/**
 * Enough of a React Navigation `navigation` object for the screens to render outside a navigator.
 * `navigate` and `push` select another screen from the list, everything else is a no-op.
 */
function createNavigationStub(select) {
  const noop = () => {};
  const go = (target) => {
    const name = typeof target === 'string' ? target : target?.name;
    if (name && allScreens.some((screen) => screen.name === name)) {
      select(name);
    } else {
      console.warn(`No screen named ${JSON.stringify(name)} in the macOS list.`);
    }
  };
  return {
    isFocused: () => true,
    addListener: () => noop,
    removeListener: noop,
    setOptions: noop,
    setParams: noop,
    dispatch: noop,
    reset: noop,
    goBack: noop,
    canGoBack: () => false,
    navigate: go,
    push: go,
    replace: go,
    getId: () => undefined,
    getParent: () => undefined,
    getState: () => ({
      key: 'root',
      index: 0,
      routeNames: [],
      routes: [],
      stale: false,
      type: 'stack',
    }),
  };
}

class ScreenErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <ScrollView contentContainerStyle={styles.panelContent}>
          <RNText style={styles.error}>
            {String(this.state.error?.message ?? this.state.error)}
          </RNText>
          <RNText style={styles.mono}>{String(this.state.error?.stack ?? '')}</RNText>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

function MountedScreen({ screen, select }) {
  const navigation = useMemo(() => createNavigationStub(select), [select]);
  const route = useMemo(() => ({ key: screen.name, name: screen.name, params: {} }), [screen]);
  // Screen configs return either a component or a function that renders an element, and both work
  // as a JSX element type.
  const Screen = screen.getComponent();
  return (
    <NavigationContext.Provider value={navigation}>
      <NavigationRouteContext.Provider value={route}>
        <ScreenErrorBoundary>
          <Screen />
        </ScreenErrorBoundary>
      </NavigationRouteContext.Provider>
    </NavigationContext.Provider>
  );
}

function App() {
  const [selectedName, setSelectedName] = useState('ModulesCore');
  const { width, height } = useWindowDimensions();
  const frame = useMemo(() => ({ x: 0, y: 0, width, height }), [width, height]);
  const selected = allScreens.find((screen) => screen.name === selectedName) ?? allScreens[0];

  // Expo Router's `Link` and `router.push` enqueue routing intents instead of calling React
  // Navigation. Without `ExpoRoot` there is no queue, so serve one that turns the href into a
  // selection. Everything that is not a plain href navigation is dropped with a warning.
  const routingQueue = useMemo(
    () => ({
      enqueue: (intent) => {
        const href = intent.type === 'NAVIGATE_TO_HREF' ? intent.payload.href : null;
        const screen = href != null ? screenForHref(href) : undefined;
        if (screen) {
          setSelectedName(screen.name);
        } else {
          console.warn(
            `Ignoring ${intent.type} routing intent${href != null ? ` for ${href}` : ''}: there is no navigator in the macOS entry.`
          );
        }
      },
      dequeue: () => {},
      startTransition: (callback) => callback(),
      transitionMode: 'never',
      setTransitionMode: () => {},
    }),
    []
  );

  return (
    <ThemeProvider>
      <RoutingQueueApiContext.Provider value={routingQueue}>
        <ImperativeRoutingQueueBridge
          enqueue={routingQueue.enqueue}
          setTransitionMode={routingQueue.setTransitionMode}
        />
        <SafeAreaInsetsContext.Provider value={NO_INSETS}>
          <SafeAreaFrameContext.Provider value={frame}>
            <View style={styles.root}>
              <View style={styles.sidebar}>
                <ScrollView style={styles.fill} contentContainerStyle={styles.sidebarContent}>
                  {sections.map((section) => (
                    <View key={section.title}>
                      <RNText style={styles.sectionTitle}>{section.title}</RNText>
                      {section.screens.map((screen) => {
                        const isSelected = screen.name === selected.name;
                        return (
                          <Pressable
                            key={screen.name}
                            onPress={() => setSelectedName(screen.name)}
                            style={[styles.rowItem, isSelected && styles.rowItemSelected]}>
                            <RNText style={[styles.rowText, isSelected && styles.rowTextSelected]}>
                              {titleOf(screen)}
                            </RNText>
                          </Pressable>
                        );
                      })}
                    </View>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.content}>
                <RNText style={styles.title}>{titleOf(selected)}</RNText>
                <View style={styles.fill}>
                  <MountedScreen key={selected.name} screen={selected} select={setSelectedName} />
                </View>
              </View>
            </View>
          </SafeAreaFrameContext.Provider>
        </SafeAreaInsetsContext.Provider>
      </RoutingQueueApiContext.Provider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: PlatformColor('windowBackgroundColor') },
  fill: { flex: 1 },
  sidebar: {
    width: 280,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: PlatformColor('separatorColor'),
  },
  sidebarContent: { paddingTop: 40, paddingBottom: 12 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: PlatformColor('tertiaryLabelColor'),
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  rowItem: { paddingHorizontal: 16, paddingVertical: 5, marginHorizontal: 8, borderRadius: 6 },
  rowItemSelected: { backgroundColor: PlatformColor('selectedContentBackgroundColor') },
  rowText: { fontSize: 13, color: PlatformColor('labelColor') },
  rowTextSelected: { color: PlatformColor('alternateSelectedControlTextColor') },
  content: { flex: 1 },
  panelContent: { padding: 24, gap: 8 },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: PlatformColor('labelColor'),
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 8,
  },
  subtitle: { fontSize: 15, fontWeight: '600', marginTop: 12, color: PlatformColor('labelColor') },
  text: { color: PlatformColor('secondaryLabelColor') },
  counter: { fontSize: 44, fontWeight: '700', color: PlatformColor('labelColor') },
  mono: { fontFamily: 'Menlo', fontSize: 11, color: PlatformColor('labelColor') },
  error: { color: PlatformColor('systemRedColor'), fontWeight: '600' },
  row: { flexDirection: 'row', gap: 8 },
});

AppRegistry.registerComponent('main', () => App);
