import { Link, useLocalSearchParams } from 'expo-router';
import { SplitView } from 'expo-router/unstable-split-view';
import { useState } from 'react';
import { Button, ScrollView, Text } from 'react-native';
import type { SplitHostCommands } from 'react-native-screens/experimental';

import { NativeStackSpikeContext } from '@/components/native-stack-spike';

export default function Layout() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const [split, setSplit] = useState<SplitHostCommands | null>(null);
  const [integrated, setIntegrated] = useState(mode === 'integrated');
  const [baselineGeneration, setBaselineGeneration] = useState(0);
  const [revision, setRevision] = useState(0);
  const [titleVersion, setTitleVersion] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [gestures, setGestures] = useState(true);
  const [largeTitle, setLargeTitle] = useState(true);
  const [disableHorizontalInsets, setDisableHorizontalInsets] = useState(false);
  const [report, setReport] = useState<Record<string, unknown>>({});
  const [collapsed, setCollapsed] = useState(false);

  return (
    <NativeStackSpikeContext
      value={{
        integrated,
        revision,
        titleVersion,
        hidden,
        gestures,
        largeTitle,
        ownership: report,
        enableIntegration: () => setIntegrated(true),
        inspect: () => setRevision((value) => value + 1),
        changeTitle: () => setTitleVersion((value) => value + 1),
        showPrimary: () => split?.show('primary'),
        report: setReport,
      }}>
      <SplitView
        key={baselineGeneration}
        ref={setSplit}
        preferredDisplayMode="oneBesideSecondary"
        showSecondaryToggleButton
        disableHorizontalSafeAreaInsets={disableHorizontalInsets}
        onCollapse={() => setCollapsed(true)}
        onExpand={() => {
          setCollapsed(false);
          setRevision((value) => value + 1);
        }}>
        <SplitView.Column header={{ title: 'Native Stack spike' }}>
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={{ padding: 16, gap: 12 }}>
            <Text selectable>
              {integrated
                ? 'Native ownership prototype'
                : 'Baseline: nested navigation controllers'}
            </Text>
            <Text selectable>{collapsed ? 'Collapsed' : 'Expanded'}</Text>
            <Button
              title={integrated ? 'Integration enabled' : 'Enable native integration'}
              disabled={integrated}
              onPress={() => setIntegrated(true)}
            />
            <Text>Reload the app for a fresh baseline. Show secondary to attach its Stack.</Text>
            <Button
              title="Remount baseline (control)"
              disabled={integrated}
              onPress={() => setBaselineGeneration((value) => value + 1)}
            />
            <Button title="Show secondary" onPress={() => split?.show('secondary')} />
            <Button
              title={`Disable horizontal insets: ${disableHorizontalInsets}`}
              onPress={() => setDisableHorizontalInsets((value) => !value)}
            />
            <Button
              title={`Header hidden: ${hidden}`}
              onPress={() => setHidden((value) => !value)}
            />
            <Button
              title={`Large title: ${largeTitle}`}
              onPress={() => setLargeTitle((value) => !value)}
            />
            <Button
              title={`Gestures: ${gestures}`}
              onPress={() => setGestures((value) => !value)}
            />
            <Button
              title="Change root title"
              onPress={() => setTitleVersion((value) => value + 1)}
            />
            <Button
              title="Inspect native ownership"
              onPress={() => setRevision((value) => value + 1)}
            />
            <Text selectable testID="native-stack-ownership">
              {JSON.stringify(report, null, 2)}
            </Text>
            <Link href="/">Exit spike</Link>
          </ScrollView>
        </SplitView.Column>
        <SplitView.Content header={{ title: 'Baseline column header' }} />
      </SplitView>
    </NativeStackSpikeContext>
  );
}
