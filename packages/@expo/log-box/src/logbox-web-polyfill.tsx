import React from 'react';

import { LogBoxLog, useLogs } from './Data/LogBoxLog';
import LogBoxInspectorContainer from './logbox-dom-polyfill';

export default () => {
  const { logs, selectedLogIndex } = useLogsFromExpoStaticError();

  return (
    <LogBoxInspectorContainer
      logs={logs}
      selectedIndex={selectedLogIndex}
      // LogBoxData actions props
      onDismiss={undefined}
      onChangeSelectedIndex={undefined}
      // Environment polyfill props
      platform="web"
      devServerUrl={undefined} // not needed for static error
      // Common actions props
      fetchTextAsync={undefined} // fallback to global fetch
      // LogBox UI actions props
      onMinimize={undefined}
      onReload={() => window.location.reload()}
      onCopyText={(text: string) => navigator.clipboard.writeText(text)}
    />
  );
};

function useLogsFromExpoStaticError(): ReturnType<typeof useLogs> {
  if (process.env.EXPO_OS === 'web' && typeof window !== 'undefined') {
    // Logbox data that is pre-fetched on the dev server and rendered here.
    const expoCliStaticErrorElement = document.getElementById('_expo-static-error');
    if (expoCliStaticErrorElement?.textContent) {
      const raw = JSON.parse(expoCliStaticErrorElement.textContent);
      return {
        ...raw,
        logs: raw.logs.map((raw: any) => new LogBoxLog(raw)),
      };
    }
  }

  throw new Error(
    '`useLogsFromExpoStaticError` must be used within a document with `_expo-static-error` element.'
  );
}
