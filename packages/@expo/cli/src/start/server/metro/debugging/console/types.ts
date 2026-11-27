import type { ConsoleSession } from './ConsoleSession';

export interface ConsoleTarget {
  id: string;
  title: string;
  appId: string;
  deviceName: string;
  // Stable across app restarts and reconnects, unlike the page id.
  logicalDeviceId: string;
  webSocketDebuggerUrl: string;
}

export interface ObjectPreview {
  type: string;
  subtype?: string;
  description?: string;
  overflow: boolean;
  properties: { name: string; type: string; subtype?: string; value?: string }[];
}

export interface RemoteObject {
  type: string;
  subtype?: string;
  className?: string;
  value?: unknown;
  unserializableValue?: string;
  description?: string;
  objectId?: string;
  preview?: ObjectPreview;
}

export interface CallFrame {
  functionName: string;
  url: string;
  lineNumber: number;
  columnNumber: number;
}

export type ConsoleApiType =
  | 'log'
  | 'debug'
  | 'info'
  | 'error'
  | 'warning'
  | 'dir'
  | 'dirxml'
  | 'table'
  | 'trace'
  | 'clear'
  | 'startGroup'
  | 'startGroupCollapsed'
  | 'endGroup'
  | 'assert'
  | 'profile'
  | 'profileEnd'
  | 'count'
  | 'timeEnd';

export interface ConsoleApiCall {
  type: ConsoleApiType;
  args: RemoteObject[];
  timestamp: number;
  context?: string;
  stackTrace?: { callFrames: CallFrame[] };
}

export interface ConsoleEntry {
  target: ConsoleTarget;
  session: ConsoleSession;
  type: ConsoleApiType;
  timestamp: number;
  args: RemoteObject[];
  callFrames: CallFrame[];
}
