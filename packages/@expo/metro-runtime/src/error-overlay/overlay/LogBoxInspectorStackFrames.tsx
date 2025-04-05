/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LogBoxInspectorSourceMapStatus } from './LogBoxInspectorSourceMapStatus';
import { LogBoxInspectorStackFrame } from './LogBoxInspectorStackFrame';
import type { StackType } from '../Data/LogBoxLog';
import type { Stack } from '../Data/LogBoxSymbolication';
import { useSelectedLog } from '../Data/LogContext';
import * as LogBoxStyle from '../UI/LogBoxStyle';
import { openFileInEditor } from '../devServerEndpoints';

export function getCollapseMessage(stackFrames: Stack, collapsed: boolean): string {
  if (stackFrames.length === 0) {
    return 'No frames to show';
  }

  const collapsedCount = stackFrames.reduce((count, { collapse }) => {
    if (collapse === true) {
      return count + 1;
    }

    return count;
  }, 0);

  if (collapsedCount === 0) {
    return 'Showing all frames';
  }

  const framePlural = `frame${collapsedCount > 1 ? 's' : ''}`;
  if (collapsedCount === stackFrames.length) {
    return `${collapsed ? 'Show' : 'Hide'}${collapsedCount > 1 ? ' all ' : ' '}${collapsedCount} ignore-listed ${framePlural}`;
  } else {
    // Match the chrome inspector wording
    return `${collapsed ? 'Show' : 'Hide'} ${collapsedCount} ignored-listed ${framePlural}`;
  }
}

export function LogBoxInspectorStackFrames({
  onRetry,
  type,
}: {
  type: StackType;
  onRetry: () => void;
}) {
  const log = useSelectedLog();

  const [collapsed, setCollapsed] = useState(() => {
    // Only collapse frames initially if some frames are not collapsed.
    return log.getAvailableStack(type)?.some(({ collapse }) => !collapse);
  });

  function getStackList() {
    if (collapsed === true) {
      return log.getAvailableStack(type)?.filter(({ collapse }) => !collapse);
    } else {
      return log.getAvailableStack(type);
    }
  }

  if (log.getAvailableStack(type)?.length === 0) {
    return null;
  }

  console.log(
    'log.symbolicated[type].status',
    log.symbolicated[type].status,
    type,
    log.symbolicated
  );

  return (
    <View style={styles.section}>
      {/* Header */}
      <View
        style={{
          alignItems: 'center',
          flexDirection: 'row',
          marginBottom: 10,

          justifyContent: 'space-between',
        }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Text style={styles.headingText}>
            {type === 'component' ? 'Component Stack' : 'Call Stack'}
          </Text>
          <LogBoxInspectorSourceMapStatus
            onPress={log.symbolicated[type].status === 'FAILED' ? onRetry : null}
            // status={'PENDING'}
            status={log.symbolicated[type].status}
          />
        </View>

        <Pressable onPress={() => setCollapsed(!collapsed)}>
          {({ hovered }) => (
            <View
              style={[
                {
                  padding: 6,
                  borderRadius: 8,
                  transition: 'background-color 0.3s',
                  outlineColor: 'transparent',
                },
                hovered && {
                  backgroundColor: 'rgba(234.6, 234.6, 244.8, 0.1)',
                },
              ]}>
              <Text
                selectable={false}
                style={{
                  color: 'rgba(234.6, 234.6, 244.8, 0.6)',
                }}>
                {getCollapseMessage(log.getAvailableStack(type)!, !!collapsed)}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Body */}
      {log.symbolicated[type].status !== 'COMPLETE' && (
        <View style={stackStyles.hintBox}>
          <Text style={stackStyles.hintText}>
            This call stack is not symbolicated. Some features are unavailable such as viewing the
            function name or tapping to open files.
          </Text>
        </View>
      )}
      <View style={{ gap: 8 }}>
        <StackFrameList list={getStackList()!} status={log.symbolicated[type].status} />
      </View>
    </View>
  );
}

function StackFrameList({
  list,
  status,
}: {
  list: Stack;
  status: 'NONE' | 'PENDING' | 'COMPLETE' | 'FAILED';
}): any {
  return list.map((frame, index) => {
    const { file, lineNumber } = frame;
    return (
      <LogBoxInspectorStackFrame
        key={index}
        frame={frame}
        onPress={
          status === 'COMPLETE' && file != null && lineNumber != null
            ? () => openFileInEditor(file, lineNumber)
            : undefined
        }
      />
    );
  });
}

const styles = StyleSheet.create({
  section: {
    marginTop: 5,
  },
  heading: {
    alignItems: 'center',
    flexDirection: 'row',

    marginBottom: 10,
  },
  headingText: {
    color: LogBoxStyle.getTextColor(1),
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    includeFontPadding: false,
    lineHeight: 20,
  },
});

const stackStyles = StyleSheet.create({
  section: {
    marginTop: 15,
  },
  heading: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  headingText: {
    color: LogBoxStyle.getTextColor(1),
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    includeFontPadding: false,
    lineHeight: 20,
  },
  body: {
    paddingBottom: 10,
  },
  bodyText: {
    color: LogBoxStyle.getTextColor(1),
    fontSize: 14,
    includeFontPadding: false,
    lineHeight: 18,
    fontWeight: '500',
    paddingHorizontal: 27,
  },
  hintText: {
    color: LogBoxStyle.getTextColor(0.7),
    fontSize: 13,
    includeFontPadding: false,
    lineHeight: 18,
    fontWeight: '400',
    marginHorizontal: 10,
  },
  hintBox: {
    backgroundColor: LogBoxStyle.getBackgroundColor(),
    marginHorizontal: 10,
    paddingHorizontal: 5,
    paddingVertical: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
});
