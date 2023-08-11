/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { LogBoxInspectorSection } from './LogBoxInspectorSection';
import { LogBoxInspectorSourceMapStatus } from './LogBoxInspectorSourceMapStatus';
import { LogBoxInspectorStackFrame } from './LogBoxInspectorStackFrame';
import type { StackType } from '../Data/LogBoxLog';
import type { Stack } from '../Data/LogBoxSymbolication';
import { useSelectedLog } from '../Data/LogContext';
import { LogBoxButton } from '../UI/LogBoxButton';
import * as LogBoxStyle from '../UI/LogBoxStyle';
import openFileInEditor from '../modules/openFileInEditor';

type Props = {
  type: StackType;
  onRetry: () => void;
};

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
    return collapsed
      ? `See${collapsedCount > 1 ? ' all ' : ' '}${collapsedCount} collapsed ${framePlural}`
      : `Collapse${collapsedCount > 1 ? ' all ' : ' '}${collapsedCount} ${framePlural}`;
  } else {
    return collapsed
      ? `See ${collapsedCount} more ${framePlural}`
      : `Collapse ${collapsedCount} ${framePlural}`;
  }
}

export function LogBoxInspectorStackFrames({ onRetry, type }: Props) {
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

  return (
    <LogBoxInspectorSection
      heading={type === 'component' ? 'Component Stack' : 'Call Stack'}
      action={
        <LogBoxInspectorSourceMapStatus
          onPress={log.symbolicated[type].status === 'FAILED' ? onRetry : null}
          status={log.symbolicated[type].status}
        />
      }>
      {log.symbolicated[type].status !== 'COMPLETE' && (
        <View style={stackStyles.hintBox}>
          <Text style={stackStyles.hintText}>
            This call stack is not symbolicated. Some features are unavailable such as viewing the
            function name or tapping to open files.
          </Text>
        </View>
      )}
      <StackFrameList list={getStackList()!} status={log.symbolicated[type].status} />
      <StackFrameFooter
        onPress={() => setCollapsed(!collapsed)}
        message={getCollapseMessage(log.getAvailableStack(type)!, !!collapsed)}
      />
    </LogBoxInspectorSection>
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

function StackFrameFooter({ message, onPress }: { message: string; onPress: () => void }) {
  return (
    <View style={stackStyles.collapseContainer}>
      <LogBoxButton
        backgroundColor={{
          default: 'transparent',
          pressed: LogBoxStyle.getBackgroundColor(1),
        }}
        onPress={onPress}
        style={stackStyles.collapseButton}>
        <Text style={stackStyles.collapse}>{message}</Text>
      </LogBoxButton>
    </View>
  );
}

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
  collapseContainer: {
    marginLeft: 15,
    flexDirection: 'row',
  },
  collapseButton: {
    borderRadius: 5,
  },
  collapse: {
    color: LogBoxStyle.getTextColor(0.7),
    fontSize: 12,
    fontWeight: '300',
    lineHeight: 20,
    marginTop: 0,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});
