'use client';

import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ScreenStack, ScreenStackItem } from 'react-native-screens';

import type { SplitViewColumnProps } from './elements';
import { IsWithinLayoutContext } from '../layouts/IsWithinLayoutContext';
import { Slot } from '../views/Navigator';

export type ColumnName = 'primary' | 'supplementary' | 'secondary';

export interface SplitViewRef {
  show: (column: 'supplementary' | 'secondary') => void;
}

interface SplitViewStackProps {
  columnChildren: ReactElement<SplitViewColumnProps>[];
}

const COLUMN_ORDER: ColumnName[] = ['primary', 'supplementary', 'secondary'];

function getColumnIndex(column: ColumnName): number {
  return COLUMN_ORDER.indexOf(column);
}

export const SplitViewStack = forwardRef<SplitViewRef, SplitViewStackProps>(function SplitViewStack(
  { columnChildren },
  ref
) {
  const hasSupplementary = columnChildren.length >= 2;
  const [visibleColumns, setVisibleColumns] = useState<ColumnName[]>(['primary']);
  const visibleColumnsRef = useRef(visibleColumns);
  visibleColumnsRef.current = visibleColumns;

  const show = useCallback(
    (column: 'supplementary' | 'secondary') => {
      if (column !== 'supplementary' && column !== 'secondary') {
        throw new Error(
          `SplitView.show(): Invalid column "${String(column)}". Only "supplementary" and "secondary" are valid arguments.`
        );
      }

      if (column === 'supplementary' && !hasSupplementary) {
        throw new Error(
          'SplitView.show(): Cannot show "supplementary" column because no supplementary column exists.'
        );
      }

      const current = visibleColumnsRef.current;

      // No-op if already visible
      if (current.includes(column)) {
        return;
      }

      const currentTop = current[current.length - 1];
      const targetIndex = getColumnIndex(column);
      const topIndex = getColumnIndex(currentTop);

      if (targetIndex <= topIndex) {
        throw new Error(
          `SplitView.show(): Cannot show "${column}" when "${currentTop}" is already visible on top.`
        );
      }

      if (column === 'secondary' && hasSupplementary && currentTop === 'primary') {
        throw new Error(
          'SplitView.show(): Cannot skip "supplementary" column. Show it first before showing "secondary".'
        );
      }

      const next = [...current, column];
      visibleColumnsRef.current = next;
      setVisibleColumns(next);
    },
    [hasSupplementary]
  );

  useImperativeHandle(ref, () => ({ show }), [show]);

  const handleDismissed = useCallback((event: { nativeEvent: { dismissCount: number } }) => {
    const count = event.nativeEvent.dismissCount;
    setVisibleColumns((current) => {
      if (current.length <= 1) return current;
      const next = current.slice(0, Math.max(1, current.length - count));
      visibleColumnsRef.current = next;
      return next;
    });
  }, []);

  const getColumnContent = (column: ColumnName): React.ReactNode => {
    if (column === 'primary') {
      return columnChildren[0]?.props.children ?? null;
    }
    if (column === 'supplementary') {
      return columnChildren[1]?.props.children ?? null;
    }
    // secondary renders the Slot (router content)
    return (
      <IsWithinLayoutContext value>
        <Slot />
      </IsWithinLayoutContext>
    );
  };

  return (
    <ScreenStack style={{ flex: 1 }}>
      {visibleColumns.map((column, index) => (
        <ScreenStackItem
          key={column}
          screenId={column}
          activityState={2}
          stackPresentation="push"
          stackAnimation="default"
          gestureEnabled={index > 0}
          onDismissed={index > 0 ? handleDismissed : undefined}>
          <SafeAreaProvider>{getColumnContent(column)}</SafeAreaProvider>
        </ScreenStackItem>
      ))}
    </ScreenStack>
  );
});
