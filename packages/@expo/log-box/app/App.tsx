import * as React from 'react';
import { LogBoxContent } from '../src/ErrorOverlay';
import { LogBoxLog } from '../src/Data/LogBoxLog';
import { parseLogBoxException } from '../src/Data/parseLogBoxLog';

console.log((globalThis as any).__expoLogBoxNativeData);
// const _testMessage = `message	String	"Unable to resolve module ./error-overlay/LogBox from /Users/krystofwoldrich/repos/expo/expo/packages/@expo/metro-runtime/src/index.ts: \n\nNone of these files exist:\n  * ../../packages/@expo/metro-runtime/src/error-overlay/LogBox(.ios.ts|.native.ts|.ts|.ios.tsx|.native.tsx|.tsx|.ios.mjs|.native.mjs|.mjs|.ios.js|.native.js|.js|.ios.jsx|.native.jsx|.jsx|.ios.json|.native.json|.json|.ios.cjs|.native.cjs|.cjs|.ios.scss|.native.scss|.scss|.ios.sass|.native.sass|.sass|.ios.css|.native.css|.css)\n  * ../../packages/@expo/metro-runtime/src/error-overlay/LogBox\n\x1b[0m \x1b[90m 18 |\x1b[39m\n \x1b[90m 19 |\x1b[39m   \x1b[90m// @ts-expect-error: TODO: Remove this when we remove the log box.\x1b[39m\n\x1b[31m\x1b[1m>\x1b[22m\x1b[39m\x1b[90m 20 |\x1b[39m   globalThis\x1b[33m.\x1b[39m__expo_dev_resetErrors \x1b[33m=\x1b[39m require(\x1b[32m'./error-overlay/LogBox'\x1b[39m)\x1b[33m.\x1b[39m\x1b[36mdefault\x1b[39m\x1b[33m.\x1b[39mclearAllLogs\x1b[33m;\x1b[39m\n \x1b[90m    |\x1b[39m                                                \x1b[31m\x1b[1m^\x1b[22m\x1b[39m\n \x1b[90m 21 |\x1b[39m }\n \x1b[90m 22 |\x1b[39m\x1b[0m"	`;

const logs: LogBoxLog[] = [
  new LogBoxLog(parseLogBoxException({
    originalMessage: (globalThis as any).__expoLogBoxNativeData?.rawMessage,
    // originalMessage: testMessage,
    stack: [],
  })),
];

console.log('logs', JSON.stringify(logs, null, 2));

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
