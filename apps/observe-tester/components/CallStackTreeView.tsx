import type { CallStackFrame, CallStackTree } from 'expo-app-metrics';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Chevron } from '@/components/Chevron';
import { useTheme } from '@/utils/theme';

export function CallStackTreeView({ tree }: { tree: CallStackTree }) {
  const theme = useTheme();
  const stacks = tree.callStacks ?? [];

  if (stacks.length === 0) {
    return (
      <Text style={[styles.empty, { color: theme.text.secondary }]}>No call stacks captured</Text>
    );
  }

  const sortedStacks = stacks
    .map((stack, originalIndex) => ({ stack, originalIndex }))
    .filter(({ stack }) => (stack.callStackRootFrames?.length ?? 0) > 0)
    .sort(
      (a, b) =>
        Number(b.stack.threadAttributed ?? false) - Number(a.stack.threadAttributed ?? false)
    );

  return (
    <View>
      {sortedStacks.map(({ stack, originalIndex }) => (
        <ThreadView key={originalIndex} stack={stack} originalIndex={originalIndex} />
      ))}
    </View>
  );
}

function ThreadView({
  stack,
  originalIndex,
}: {
  stack: NonNullable<CallStackTree['callStacks']>[number];
  originalIndex: number;
}) {
  const theme = useTheme();
  const isAttributed = !!stack.threadAttributed;
  const [expanded, setExpanded] = useState(isAttributed);
  const [framesMounted, setFramesMounted] = useState(isAttributed);
  const frames = flattenFrames(stack.callStackRootFrames ?? []);

  useEffect(() => {
    if (expanded && !framesMounted) {
      const handle = requestAnimationFrame(() => setFramesMounted(true));
      return () => cancelAnimationFrame(handle);
    }
  }, [expanded, framesMounted]);

  return (
    <View
      style={[
        styles.thread,
        {
          backgroundColor: theme.background.element,
          borderColor: theme.border.default,
        },
      ]}>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={({ pressed }) => [
          styles.threadHeader,
          expanded && styles.threadHeaderExpanded,
          pressed && { opacity: 0.6 },
        ]}>
        <Text style={[styles.threadTitle, { color: theme.text.default }]} numberOfLines={1}>
          Thread {originalIndex + 1}
          {isAttributed ? (
            <Text style={[styles.attributed, { color: theme.text.tertiary }]}>
              {' · '}
              <Text style={{ color: theme.text.danger }}>attributed</Text>
            </Text>
          ) : null}
          {!expanded ? (
            <Text style={[styles.frameCount, { color: theme.text.tertiary }]}>
              {' '}
              · {frames.length} frame{frames.length === 1 ? '' : 's'}
            </Text>
          ) : null}
        </Text>
        <Chevron expanded={expanded} />
      </Pressable>
      {framesMounted ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={!expanded && styles.hidden}>
          <View>
            {frames.map((frame, frameIndex) => (
              <FrameRow key={frameIndex} frame={frame} />
            ))}
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}

function flattenFrames(rootFrames: CallStackFrame[]): CallStackFrame[] {
  const result: CallStackFrame[] = [];
  const stack: CallStackFrame[] = [...rootFrames];
  while (stack.length > 0) {
    const next = stack.pop()!;
    result.push(next);
    const subFrames = next.subFrames ?? [];
    for (let i = subFrames.length - 1; i >= 0; i--) {
      stack.push(subFrames[i]);
    }
  }
  return result;
}

function FrameRow({ frame }: { frame: CallStackFrame }) {
  const theme = useTheme();
  return (
    <Text style={[styles.frame, { color: theme.text.default }]}>
      <Text style={{ color: theme.text.tertiary }}>{formatAddress(frame.address)} </Text>
      <Text style={{ color: theme.text.default }}>{frame.binaryName ?? '(unknown)'}</Text>
      {frame.symbol ? (
        <Text style={{ color: theme.text.default }}> {frame.symbol}</Text>
      ) : (
        <Text style={{ color: theme.text.secondary }}>
          {formatOffset(frame.offsetIntoBinaryTextSegment)}
        </Text>
      )}
    </Text>
  );
}

function formatAddress(address: number | null | undefined) {
  if (address == null) return '0x0000000000000000';
  return '0x' + address.toString(16).padStart(16, '0');
}

function formatOffset(offset: number | null | undefined) {
  if (offset == null) return '';
  return ' +0x' + offset.toString(16);
}

const styles = StyleSheet.create({
  thread: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 8,
  },
  threadHeaderExpanded: {
    marginBottom: 8,
  },
  threadTitle: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  attributed: {
    fontSize: 12,
    fontWeight: '600',
  },
  frameCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  frame: {
    fontFamily: 'Menlo',
    fontSize: 11,
    paddingVertical: 2,
  },
  empty: {
    fontSize: 13,
    textAlign: 'center',
    marginVertical: 12,
  },
  hidden: {
    display: 'none',
  },
});
