/**
 * Copyright (c) 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useState } from 'react';
import type { GestureResponderEvent } from 'react-native';
import { Pressable } from 'react-native';

import type { StackType } from '../Data/LogBoxLog';
import {
  getStackFormattedLocation,
  openFileInEditor,
  type MetroStackFrame,
} from '../devServerEndpoints';
import { LogBoxInspectorSourceMapStatus } from './LogBoxInspectorSourceMapStatus';

import styles from './StackTraceList.module.css';
export function StackTraceList({
  onRetry,
  type,
  stack,
  symbolicationStatus,
  projectRoot,
}: {
  type: StackType;
  projectRoot?: string;
  onRetry: () => void;
  stack: MetroStackFrame[] | null;
  symbolicationStatus: 'COMPLETE' | 'FAILED' | 'NONE' | 'PENDING';
}) {
  const [collapsed, setCollapsed] = useState(true);
  // const [collapsed, setCollapsed] = useState(() => {
  //   // Only collapse frames initially if some frames are not collapsed.
  //   return stack?.some(({ collapse }) => !collapse);
  // });

  const visibleStack = !stack
    ? []
    : collapsed === true
      ? stack.filter(({ collapse }) => !collapse)
      : stack;
  const stackCount = stack?.length;
  if (!stackCount) {
    return null;
  }

  const collapseTitle = getCollapseMessage(stack, !!collapsed);

  return (
    <div style={{ marginTop: 5, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: 4,
          justifyContent: 'space-between',
        }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <h3
            style={{
              fontFamily: 'var(--expo-log-font-family)',
              color: 'var(--expo-log-color-label)',
              fontSize: 18,
              fontWeight: '600',
              margin: 0,
            }}>
            {type === 'component' ? 'Component Stack' : 'Call Stack'}
          </h3>
          <span
            data-text
            style={{
              backgroundColor: 'rgba(234.6, 234.6, 244.8, 0.1)',
              fontFamily: 'var(--expo-log-font-family)',
              color: 'var(--expo-log-color-label)',
              borderRadius: 50,
              fontSize: 12,
              aspectRatio: '1/1',
              display: 'flex',
              width: 22,
              height: 22,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            {stackCount}
          </span>

          <LogBoxInspectorSourceMapStatus
            onPress={symbolicationStatus === 'FAILED' ? onRetry : null}
            status={symbolicationStatus}
          />
        </div>

        <Pressable onPress={() => setCollapsed(!collapsed)}>
          {({ hovered }) => (
            <div
              title={collapseTitle}
              style={{
                padding: 6,
                borderRadius: 8,
                transition: 'background-color 0.3s',
                outlineColor: 'transparent',
                backgroundColor: hovered ? 'rgba(234.6, 234.6, 244.8, 0.1)' : undefined,
                color: 'rgba(234.6, 234.6, 244.8, 0.6)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 2,
              }}>
              <span
                className={styles.collapseTitle}
                style={{
                  fontFamily: 'var(--expo-log-font-family)',
                  fontSize: 14,
                  userSelect: 'none',
                  color: 'rgba(234.6, 234.6, 244.8, 0.6)',
                }}>
                {collapseTitle}
              </span>

              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="md-hidden">
                {collapsed ? (
                  <>
                    <path d="m7 15 5 5 5-5" />
                    <path d="m7 9 5-5 5 5" />
                  </>
                ) : (
                  <>
                    <path d="m7 20 5-5 5 5" />
                    <path d="m7 4 5 5 5-5" />
                  </>
                )}
              </svg>
            </div>
          )}
        </Pressable>
      </div>

      {/* Body */}
      {symbolicationStatus !== 'COMPLETE' && (
        <div
          style={{
            backgroundColor: `var(--expo-log-secondary-system-background)`,
            border: `1px solid var(--expo-log-color-border)`,
            padding: `10px 15px`,
            borderRadius: 5,
          }}>
          <span
            style={{
              fontFamily: 'var(--expo-log-font-family)',
              color: 'var(--expo-log-color-label)',
              opacity: 0.7,
              fontSize: 13,
              fontWeight: '400',
            }}>
            This call stack is not symbolicated. Some features are unavailable such as viewing the
            function name or tapping to open files.
          </span>
        </div>
      )}

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {visibleStack?.map((frame, index) => {
          const { file, lineNumber } = frame;
          return (
            <StackTraceItem
              key={index}
              projectRoot={projectRoot}
              frame={frame}
              onPress={
                symbolicationStatus === 'COMPLETE' && file != null && lineNumber != null
                  ? () => openFileInEditor(file, lineNumber)
                  : undefined
              }
            />
          );
        })}
      </div>
    </div>
  );
}

function StackTraceItem({
  frame,
  onPress,
  projectRoot,
}: {
  frame: MetroStackFrame;
  projectRoot?: string;
  onPress?: (event: GestureResponderEvent) => void;
}) {
  return (
    <Pressable onPress={onPress}>
      {({ hovered }) => (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            marginLeft: -6,
            padding: `6px 12px`,
            borderRadius: 8,
            transition: 'background-color 0.3s',
            outlineColor: 'transparent',
            backgroundColor: hovered ? 'rgba(234.6, 234.6, 244.8, 0.1)' : undefined,
            opacity: frame.collapse === true ? 0.4 : 1,
            color: 'var(--expo-log-color-label)',
          }}>
          <code
            style={{
              fontSize: 14,
              fontWeight: '400',
              lineHeight: 1.5,
            }}>
            {frame.methodName}
          </code>
          <code
            style={{
              fontSize: 12,
              fontWeight: '300',
              opacity: 0.7,
            }}>
            {getStackFormattedLocation(projectRoot ?? '', frame)}
          </code>
        </div>
      )}
    </Pressable>
  );
}

function getCollapseMessage(stackFrames: MetroStackFrame[], collapsed: boolean): string {
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
