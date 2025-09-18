import * as React from 'react';
import { LogBoxContent } from '../src/ErrorOverlay';
import { LogBoxLog } from '../src/Data/LogBoxLog';
import { parseLogBoxException } from '../src/Data/parseLogBoxLog';

declare global {
  var __expoLogBoxNativeData: {
    rawMessage?: string;
  } | undefined;
}

const logs: LogBoxLog[] = [
  new LogBoxLog(parseLogBoxException({
    originalMessage: globalThis.__expoLogBoxNativeData?.rawMessage,
    stack: [],
  })),
];

export default function App() {
  const selectedLogIndex = logs.length > 0 ? 0 : -1;
  return (
    <LogBoxContent
      log={logs[selectedLogIndex]}
      selectedLogIndex={selectedLogIndex}
      logs={logs}
    />
  );
}
