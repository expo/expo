/**
 * Copyright (c) 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useState, type SVGProps } from 'react';

import { LogBoxInspectorSourceMapStatus } from './LogBoxInspectorSourceMapStatus';
import styles from './StackTraceList.module.css';
import { useDevServer } from '../ContextDevServer';
import type { StackType, MetroStackFrame } from '../Data/Types';
import {
  getStackFormattedLocation,
  isStackFileAnonymous,
  openFileInEditor,
} from '../utils/devServerEndpoints';

function Transition({
  children,
  status,
  onExitComplete,
  isInitial,
  index,
  initialDelay = 50,
}: {
  children: React.ReactNode;
  status: 'stable' | 'entering' | 'exiting';
  onExitComplete: () => void;
  isInitial: boolean;
  index: number;
  initialDelay?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (isInitial && status === 'stable') {
      element.style.height = '0px';
      element.style.opacity = '0';
      setTimeout(() => {
        element.style.height = `${element.scrollHeight}px`;
        element.style.opacity = '1';
      }, index * initialDelay);
    } else if (status === 'entering') {
      element.style.height = '0px';
      element.style.opacity = '0';
      requestAnimationFrame(() => {
        element.style.height = `${element.scrollHeight}px`;
        element.style.opacity = '1';
      });
    } else if (status === 'exiting') {
      element.style.height = `${element.scrollHeight}px`;
      element.style.opacity = '1';
      requestAnimationFrame(() => {
        element.style.height = '0px';
        element.style.opacity = '0';
      });
    } else if (status === 'stable') {
      element.style.height = `${element.scrollHeight}px`;
      element.style.opacity = '1';
    }
  }, [status, isInitial, index]);

  React.useEffect(() => {
    if (status === 'exiting') {
      const handleTransitionEnd = (e: TransitionEvent) => {
        if (e.propertyName === 'height') {
          onExitComplete();
        }
      };
      ref.current?.addEventListener('transitionend', handleTransitionEnd);
      return () => {
        ref.current?.removeEventListener('transitionend', handleTransitionEnd);
      };
    }
    return undefined;
  }, [status, onExitComplete]);

  return (
    <div ref={ref} className={styles.transition}>
      {children}
    </div>
  );
}

type DisplayItem = {
  item: { id: number; content: React.ReactNode; isCollapsed: boolean };
  status: 'stable' | 'entering' | 'exiting';
};

function List({
  items,
  showCollapsed,
  isInitial,
  initialDelay,
}: {
  items: { id: number; content: React.ReactNode; isCollapsed: boolean }[];
  showCollapsed: boolean;
  isInitial: boolean;
  initialDelay: number;
}) {
  const [displayItems, setDisplayItems] = React.useState<DisplayItem[]>(
    items.filter((item) => !item.isCollapsed).map((item) => ({ item, status: 'stable' }))
  );

  React.useEffect(() => {
    const visibleItems = showCollapsed ? items : items.filter((item) => !item.isCollapsed);

    setDisplayItems((prev: DisplayItem[]): DisplayItem[] => {
      const prevIds = new Set(prev.map((d) => d.item.id));
      const newItems: DisplayItem[] = visibleItems
        .filter((item) => !prevIds.has(item.id))
        .map((item) => ({ item, status: 'entering' }));
      const updatedPrev: DisplayItem[] = prev.map((d) => {
        if (!visibleItems.some((item) => item.id === d.item.id)) {
          return { ...d, status: 'exiting' };
        }
        return d;
      });
      return [...updatedPrev, ...newItems].sort((a, b) => a.item.id - b.item.id);
    });
  }, [showCollapsed, items]);

  const onExitComplete = (id: number) => {
    setDisplayItems((prev) => prev.filter((d) => d.item.id !== id));
  };

  return (
    <div>
      {displayItems.map((d, index) => (
        <Transition
          key={d.item.id}
          status={d.status}
          onExitComplete={() => onExitComplete(d.item.id)}
          isInitial={isInitial}
          initialDelay={initialDelay}
          index={index}>
          {d.item.content}
        </Transition>
      ))}
    </div>
  );
}

function useContainerWidth() {
  const [width, setWidth] = useState(0);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    if (ref.current) {
      setWidth(ref.current.clientWidth);

      const handleResize = () => {
        if (ref.current) {
          setWidth(ref.current.clientWidth);
        }
      };
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
    return undefined;
  }, [ref]);

  return { width, ref };
}

export function StackTraceList({
  onRetry,
  type,
  stack,
  symbolicationStatus,
}: {
  type: StackType;
  onRetry: () => void;
  stack: MetroStackFrame[] | null;
  symbolicationStatus: 'COMPLETE' | 'FAILED' | 'NONE' | 'PENDING';
}) {
  const [collapsed, setCollapsed] = useState(true);

  const stackCount = stack?.length;

  const [isInitial, setIsInitial] = React.useState(true);

  const initialDelay = 50;
  const initialTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => {
    if (isInitial) {
      const visibleCount = stack?.filter((frame) => !frame.collapse).length ?? 0;

      initialTimer.current = setTimeout(
        () => setIsInitial(false),
        visibleCount * initialDelay + 500
      );
    }
    return () => {
      if (initialTimer.current) {
        clearTimeout(initialTimer.current);
        initialTimer.current = null;
      }
    };
  }, [isInitial]);

  const { width: containerWidth, ref } = useContainerWidth();

  if (!stackCount) {
    return null;
  }

  const collapseTitle = getCollapseMessage(stack, !!collapsed);

  // Unfortunately RN implementation ignores symbolication collapse flag and expands all frames of components stack.
  // https://github.com/facebook/react-native/blob/93ac7db54ead26da002abebb8f987f58b6be3a1d/packages/react-native/Libraries/LogBox/Data/LogBoxLog.js#L51
  const expandFirst = 4;
  const stackTraceItems = stack.map((frame, index) => {
    const { file, lineNumber } = frame;
    const isLaunchable =
      !isStackFileAnonymous(frame) &&
      symbolicationStatus === 'COMPLETE' &&
      file != null &&
      lineNumber != null;
    const isCollapsed =
      type === 'component' && process.env.EXPO_DOM_HOST_OS !== 'web'
        ? index >= expandFirst
        : !!frame.collapse;
    return {
      id: index,
      content: (
        <StackTraceItem
          key={index}
          isLaunchable={isLaunchable}
          frame={frame}
          onPress={isLaunchable ? () => openFileInEditor(file, lineNumber) : undefined}
        />
      ),
      isCollapsed,
    };
  });

  return (
    <div className={styles.root}>
      {/* Header */}
      <div ref={ref} className={styles.header}>
        <div className={styles.headerLeft}>
          {type === 'component' ? (
            <ReactIcon stroke="unset" className={styles.headerIcon} />
          ) : (
            <JavaScriptIcon className={styles.headerIcon} />
          )}
          <h3 className={styles.headerTitle}>
            {type === 'component' ? 'Component Stack' : 'Call Stack'}
          </h3>
          <span data-text className={styles.badge}>
            {stackCount}
          </span>

          <LogBoxInspectorSourceMapStatus
            onPress={symbolicationStatus === 'FAILED' ? onRetry : null}
            status={symbolicationStatus}
          />
        </div>

        <button className={styles.collapseButton} onClick={() => setCollapsed(!collapsed)}>
          <div title={collapseTitle.full} className={styles.collapseContent}>
            <span className={styles.collapseTitle}>
              {containerWidth > 440 ? collapseTitle.full : collapseTitle.short}
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
              strokeLinejoin="round">
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
        </button>
      </div>

      {/* Body */}
      {symbolicationStatus !== 'COMPLETE' && (
        <div className={styles.warningBox}>
          <span className={styles.warningText}>
            This call stack is not symbolicated. Some features are unavailable such as viewing the
            function name or tapping to open files.
          </span>
        </div>
      )}

      {/* List */}
      <div className={styles.list}>
        <List
          initialDelay={initialDelay}
          items={stackTraceItems}
          showCollapsed={!collapsed}
          isInitial={isInitial}
        />
      </div>
    </div>
  );
}

function StackTraceItem({
  frame,
  onPress,
  isLaunchable,
}: {
  isLaunchable: boolean;
  frame: MetroStackFrame;
  onPress?: () => void;
}) {
  const { serverRoot } = useDevServer();
  const fileName = getStackFormattedLocation(serverRoot, frame);
  return (
    <div
      aria-disabled={!isLaunchable ? true : undefined}
      onClick={onPress}
      className={styles.stackFrame}
      data-collapsed={frame.collapse === true ? '' : undefined}>
      <code className={styles.stackFrameTitle}>{frame.methodName}</code>
      <code className={styles.stackFrameFile}>{fileName}</code>
    </div>
  );
}

const ReactIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.41 0-.783.093-1.106.278-1.375.793-1.683 3.264-.973 6.365C1.98 8.917 0 10.42 0 12.004c0 1.59 1.99 3.097 5.043 4.03-.704 3.113-.39 5.588.988 6.38.32.187.69.275 1.102.275 1.345 0 3.107-.96 4.888-2.624 1.78 1.654 3.542 2.603 4.887 2.603.41 0 .783-.09 1.106-.275 1.374-.792 1.683-3.263.973-6.365C22.02 15.096 24 13.59 24 12.004c0-1.59-1.99-3.097-5.043-4.032.704-3.11.39-5.587-.988-6.38a2.167 2.167 0 0 0-1.092-.278zm-.005 1.09v.006c.225 0 .406.044.558.127.666.382.955 1.835.73 3.704-.054.46-.142.945-.25 1.44a23.476 23.476 0 0 0-3.107-.534A23.892 23.892 0 0 0 12.769 4.7c1.592-1.48 3.087-2.292 4.105-2.295zm-9.77.02c1.012 0 2.514.808 4.11 2.28-.686.72-1.37 1.537-2.02 2.442a22.73 22.73 0 0 0-3.113.538 15.02 15.02 0 0 1-.254-1.42c-.23-1.868.054-3.32.714-3.707.19-.09.4-.127.563-.132zm4.882 3.05c.455.468.91.992 1.36 1.564-.44-.02-.89-.034-1.345-.034-.46 0-.915.01-1.36.034.44-.572.895-1.096 1.345-1.565zM12 8.1c.74 0 1.477.034 2.202.093.406.582.802 1.203 1.183 1.86.372.64.71 1.29 1.018 1.946-.308.655-.646 1.31-1.013 1.95-.38.66-.773 1.288-1.18 1.87a25.64 25.64 0 0 1-4.412.005 26.64 26.64 0 0 1-1.183-1.86c-.372-.64-.71-1.29-1.018-1.946a25.17 25.17 0 0 1 1.013-1.954c.38-.66.773-1.286 1.18-1.868A25.245 25.245 0 0 1 12 8.098zm-3.635.254c-.24.377-.48.763-.704 1.16-.225.39-.435.782-.635 1.174-.265-.656-.49-1.31-.676-1.947.64-.15 1.315-.283 2.015-.386zm7.26 0c.695.103 1.365.23 2.006.387-.18.632-.405 1.282-.66 1.933a25.952 25.952 0 0 0-1.345-2.32zm3.063.675c.484.15.944.317 1.375.498 1.732.74 2.852 1.708 2.852 2.476-.005.768-1.125 1.74-2.857 2.475-.42.18-.88.342-1.355.493a23.966 23.966 0 0 0-1.1-2.98c.45-1.017.81-2.01 1.085-2.964zm-13.395.004c.278.96.645 1.957 1.1 2.98a23.142 23.142 0 0 0-1.086 2.964c-.484-.15-.944-.318-1.37-.5-1.732-.737-2.852-1.706-2.852-2.474 0-.768 1.12-1.742 2.852-2.476.42-.18.88-.342 1.356-.494zm11.678 4.28c.265.657.49 1.312.676 1.948-.64.157-1.316.29-2.016.39a25.819 25.819 0 0 0 1.341-2.338zm-9.945.02c.2.392.41.783.64 1.175.23.39.465.772.705 1.143a22.005 22.005 0 0 1-2.006-.386c.18-.63.406-1.282.66-1.933zM17.92 16.32c.112.493.2.968.254 1.423.23 1.868-.054 3.32-.714 3.708-.147.09-.338.128-.563.128-1.012 0-2.514-.807-4.11-2.28.686-.72 1.37-1.536 2.02-2.44 1.107-.118 2.154-.3 3.113-.54zm-11.83.01c.96.234 2.006.415 3.107.532.66.905 1.345 1.727 2.035 2.446-1.595 1.483-3.092 2.295-4.11 2.295a1.185 1.185 0 0 1-.553-.132c-.666-.38-.955-1.834-.73-3.703.054-.46.142-.944.25-1.438zm4.56.64c.44.02.89.034 1.345.034.46 0 .915-.01 1.36-.034-.44.572-.895 1.095-1.345 1.565-.455-.47-.91-.993-1.36-1.565z" />
  </svg>
);
const JavaScriptIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M0 0h24v24H0V0zm22.034 18.276c-.175-1.095-.888-2.015-3.003-2.873-.736-.345-1.554-.585-1.797-1.14-.091-.33-.105-.51-.046-.705.15-.646.915-.84 1.515-.66.39.12.75.42.976.9 1.034-.676 1.034-.676 1.755-1.125-.27-.42-.404-.601-.586-.78-.63-.705-1.469-1.065-2.834-1.034l-.705.089c-.676.165-1.32.525-1.71 1.005-1.14 1.291-.811 3.541.569 4.471 1.365 1.02 3.361 1.244 3.616 2.205.24 1.17-.87 1.545-1.966 1.41-.811-.18-1.26-.586-1.755-1.336l-1.83 1.051c.21.48.45.689.81 1.109 1.74 1.756 6.09 1.666 6.871-1.004.029-.09.24-.705.074-1.65l.046.067zm-8.983-7.245h-2.248c0 1.938-.009 3.864-.009 5.805 0 1.232.063 2.363-.138 2.711-.33.689-1.18.601-1.566.48-.396-.196-.597-.466-.83-.855-.063-.105-.11-.196-.127-.196l-1.825 1.125c.305.63.75 1.172 1.324 1.517.855.51 2.004.675 3.207.405.783-.226 1.458-.691 1.811-1.411.51-.93.402-2.07.397-3.346.012-2.054 0-4.109 0-6.179l.004-.056z" />
  </svg>
);

function getCollapseMessage(
  stackFrames: MetroStackFrame[],
  collapsed: boolean
): { short: string; full: string } {
  if (stackFrames.length === 0) {
    return { full: 'No frames to show', short: 'No frames' };
  }

  const collapsedCount = stackFrames.reduce((count, { collapse }) => {
    if (collapse === true) {
      return count + 1;
    }
    return count;
  }, 0);

  if (collapsedCount === 0) {
    if (collapsed) {
      return { full: 'Show all', short: 'Show all' };
    } else {
      return { full: 'Hide extended frames', short: 'Hide' };
    }
  }

  const short = collapsed ? 'Show' : 'Hide';

  const framePlural = `frame${collapsedCount > 1 ? 's' : ''}`;
  if (collapsedCount === stackFrames.length) {
    return {
      full: `${short}${collapsedCount > 1 ? ' all ' : ' '}${collapsedCount} ignore-listed ${framePlural}`,
      short,
    };
  } else {
    // Match the chrome inspector wording
    return { full: `${short} ${collapsedCount} ignored-listed ${framePlural}`, short };
  }
}
