import { ObserveErrorBoundary } from 'expo-observe';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { useTheme } from '@/utils/theme';

type RenderErrorKind = 'error-object' | 'string-throw' | 'nested';

const LOCAL_TRIGGERS: { kind: RenderErrorKind; title: string; description: string }[] = [
  {
    kind: 'error-object',
    title: 'Throw Error in render',
    description: 'A child throws an Error while rendering',
  },
  {
    kind: 'string-throw',
    title: 'Throw a string in render',
    description: 'Non-Error throw value (no stack)',
  },
  {
    kind: 'nested',
    title: 'Throw in a nested child',
    description: 'Error several components deep, to exercise the component stack',
  },
];

// Throws during React's render phase. Render-phase errors are routed to the nearest error boundary
// (never to `global.ErrorUtils`), so this is what `ObserveErrorBoundary` is meant to capture.
function Boom({ kind }: { kind: RenderErrorKind }): never {
  if (kind === 'string-throw') {
    // eslint-disable-next-line no-throw-literal
    throw 'Intentional string thrown from observe-tester render';
  }
  throw new Error(`Intentional render error from observe-tester (${kind})`);
}

function NestedBoom({ kind }: { kind: RenderErrorKind }) {
  return (
    <View>
      <View>
        <Boom kind={kind} />
      </View>
    </View>
  );
}

export function RenderErrorSection() {
  const theme = useTheme();
  // `crash` carries the kind to throw; bumping `attempt` remounts the boundary so a trigger can be
  // fired again after the previous one was caught (the boundary renders nothing once it has caught).
  const [crash, setCrash] = useState<RenderErrorKind | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [escape, setEscape] = useState(false);

  return (
    <>
      <Text style={[styles.sectionTitle, { color: theme.text.default }]}>Render errors</Text>
      <Text style={[styles.sectionHint, { color: theme.text.secondary }]}>
        Throw during React render to exercise{' '}
        <Text style={styles.code}>ObserveErrorBoundary</Text>. Each is recorded as an{' '}
        <Text style={styles.code}>errorBoundary</Text> exception and dispatched on the next flush.
        The locally-caught triggers report and recover so the app stays usable; the last one escapes
        to the root boundary, which renders its fallback in place of the app.
      </Text>

      {LOCAL_TRIGGERS.map(({ kind, title, description }) => (
        <Button
          key={kind}
          title={title}
          description={description}
          onPress={() => {
            setCrash(kind);
            setAttempt((value) => value + 1);
          }}
          theme="secondary"
        />
      ))}

      {/* A fresh boundary per attempt: keying on `attempt` remounts it so it can catch again. The
          throwing child renders only while a kind is set; the Reset button below clears it so this
          slot returns to a healthy, ready-to-fire state. `fallback={null}` renders nothing in place
          of the failed subtree; the sibling `Recovered` below surfaces the confirmation and reset. */}
      <ObserveErrorBoundary key={attempt} fallback={null}>
        {crash === 'nested' ? <NestedBoom kind={crash} /> : crash != null ? <Boom kind={crash} /> : null}
      </ObserveErrorBoundary>
      <Recovered visible={crash != null} theme={theme} onAcknowledge={() => setCrash(null)} />

      <Button
        title="Throw render error (escape to root)"
        description="Not locally caught; propagates to the ObserveRoot boundary"
        onPress={() => setEscape(true)}
        theme="secondary"
        colors={{ borderColor: theme.text.danger, textColor: theme.text.danger }}
      />
      {escape ? <NestedBoom kind="error-object" /> : null}
    </>
  );
}

// Rendered alongside the boundary. Because the boundary swaps its subtree to `null` after catching,
// this sibling stays mounted and surfaces a confirmation plus a reset so the section is repeatable.
function Recovered({
  visible,
  theme,
  onAcknowledge,
}: {
  visible: boolean;
  theme: ReturnType<typeof useTheme>;
  onAcknowledge: () => void;
}) {
  if (!visible) {
    return null;
  }
  return (
    <View style={styles.recovered}>
      <Text style={[styles.recoveredText, { color: theme.text.secondary }]}>
        Render error reported. It will dispatch on the next flush.
      </Text>
      <Button title="Reset" onPress={onAcknowledge} theme="tertiary" />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 13,
    marginBottom: 16,
  },
  code: {
    fontFamily: 'Menlo',
    fontSize: 12,
  },
  recovered: {
    marginVertical: 8,
    gap: 8,
  },
  recoveredText: {
    fontSize: 13,
  },
});
