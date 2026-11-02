import { Link, router, usePathname } from 'expo-router';
import { useSplitView } from 'expo-router/unstable-split-view';
import { createContext, use, useState, type Dispatch, type SetStateAction } from 'react';
import { Button, Platform, ScrollView, Switch, Text, View } from 'react-native';

import { StackProbe } from './split-stack-scope-probe';

export interface ScopeOptions {
  omitContent: boolean;
  splitHeaderHidden: boolean;
  threeColumns: boolean;
  disableHorizontalSafeAreaInsets: boolean;
  showInspector: boolean;
  titleRevision: number;
  fullScreenModal: boolean;
  stackHeaderHidden: boolean;
  rootGestureEnabled: boolean;
  showSecondaryToggleButton: boolean;
}

export const ScopeContext = createContext<{
  options: ScopeOptions;
  setOptions: Dispatch<SetStateAction<ScopeOptions>>;
} | null>(null);

export function useScopeOptions() {
  const context = use(ScopeContext);
  if (!context) throw new Error('Split Stack scope controls require the demo layout.');
  return context;
}

export function ScopeSidebar() {
  const [count, setCount] = useState(0);
  const { show } = useSplitView();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text>Independent sidebar state</Text>
      <Button title={`Sidebar count: ${count}`} onPress={() => setCount(count + 1)} />
      <Link href="/split-view-stack-scope" splitViewColumnName="secondary">
        Plain content
      </Link>
      <Link href="/split-view-stack-scope/stack" splitViewColumnName="secondary">
        Nested Stack
      </Link>
      <Button title="Show content" onPress={() => show('secondary')} />
      <Text>
        Changing plain/Stack routes can discard the Stack history. Header/inset toggles must not.
      </Text>
    </ScrollView>
  );
}

export function ScopeScreen({ kind }: { kind: 'plain' | 'root' | 'pushed' | 'modal' }) {
  const { options, setOptions } = useScopeOptions();
  const { show, isCollapsed, compactColumn } = useSplitView();
  const pathname = usePathname();
  const [count, setCount] = useState(0);
  return (
    <View style={{ flex: 1, backgroundColor: '#e5efff' }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingVertical: 16, gap: 8 }}>
        <Text style={{ fontWeight: 'bold' }}>Automatic Stack spike — {kind}</Text>
        <Text>{pathname}</Text>
        <Text>
          Collapsed: {String(isCollapsed)}; compact column: {compactColumn ?? 'unset'}
        </Text>
        <Text>Automatic Stack ownership</Text>
        <Text>Omit optional Content configuration</Text>
        <Switch
          accessibilityLabel="Omit Content configuration"
          value={options.omitContent}
          onValueChange={(value) => setOptions((current) => ({ ...current, omitContent: value }))}
        />
        <Text>Configured split header hidden (restored on plain content)</Text>
        <Switch
          accessibilityLabel="Hide configured split header"
          value={options.splitHeaderHidden}
          onValueChange={(value) =>
            setOptions((current) => ({ ...current, splitHeaderHidden: value }))
          }
        />
        <Text>Three columns (remounts the split host)</Text>
        <Switch
          accessibilityLabel="Three columns"
          value={options.threeColumns}
          onValueChange={(value) => setOptions((current) => ({ ...current, threeColumns: value }))}
        />
        <Text>Explicitly hide Stack header</Text>
        <Switch
          accessibilityLabel="Explicitly hide Stack header"
          value={options.stackHeaderHidden}
          onValueChange={(value) =>
            setOptions((current) => ({ ...current, stackHeaderHidden: value }))
          }
        />
        <Text>Root gesture enabled</Text>
        <Switch
          accessibilityLabel="Root gesture enabled"
          value={options.rootGestureEnabled}
          onValueChange={(value) =>
            setOptions((current) => ({ ...current, rootGestureEnabled: value }))
          }
        />
        <Text>Disable horizontal insets in every column</Text>
        <Switch
          accessibilityLabel="Disable all horizontal insets"
          value={options.disableHorizontalSafeAreaInsets}
          onValueChange={(value) =>
            setOptions((current) => ({ ...current, disableHorizontalSafeAreaInsets: value }))
          }
        />
        <Text>Inspector</Text>
        <Switch
          accessibilityLabel="Show inspector"
          value={options.showInspector}
          onValueChange={(value) => setOptions((current) => ({ ...current, showInspector: value }))}
        />
        <Text>Secondary toggle (exercise native bar refresh)</Text>
        <Switch
          accessibilityLabel="Secondary toggle"
          value={options.showSecondaryToggleButton}
          onValueChange={(value) =>
            setOptions((current) => ({ ...current, showSecondaryToggleButton: value }))
          }
        />
        <Button
          title={`Change Stack title/options: ${options.titleRevision}`}
          onPress={() =>
            setOptions((current) => ({ ...current, titleRevision: current.titleRevision + 1 }))
          }
        />
        <Button title={`Screen count: ${count}`} onPress={() => setCount(count + 1)} />
        <Button title="Show sidebar (manual)" onPress={() => show('primary')} />
        <Link href="/split-view-stack-scope" splitViewColumnName="secondary">
          Plain content
        </Link>
        <Link href="/split-view-stack-scope/stack" splitViewColumnName="secondary">
          Stack root
        </Link>
        {kind === 'root' && (
          <Link href="/split-view-stack-scope/stack/pushed" push>
            Push screen
          </Link>
        )}
        {kind === 'pushed' && <Button title="Pop nested screen" onPress={() => router.back()} />}
        {(kind === 'root' || kind === 'pushed') && (
          <>
            <Text>Full-screen modal</Text>
            <Switch
              accessibilityLabel="Full-screen modal"
              value={options.fullScreenModal}
              onValueChange={(value) =>
                setOptions((current) => ({ ...current, fullScreenModal: value }))
              }
            />
            <Link href="/split-view-stack-scope/stack/modal">Present modal</Link>
          </>
        )}
        {kind === 'modal' && <Button title="Dismiss modal" onPress={() => router.back()} />}
        <Text>Blue reaches the content edge; there is no demo horizontal padding.</Text>
        <Text>
          Stack owns its column automatically. Native root Back returns to the previous column;
          pushed Back pops this Stack. Expanded content keeps its column insets.
        </Text>
        <Text>
          Runtime platform: {Platform.OS} {String(Platform.Version)}
        </Text>
        <StackProbe />
      </ScrollView>
    </View>
  );
}
