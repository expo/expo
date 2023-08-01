import React from 'react';
import { Platform } from 'react-native';

import { LogBoxLog } from './LogBoxLog';

// Context provider for Array<LogBoxLog>

export const LogContext = React.createContext<{
  selectedLogIndex: number;
  isDisabled: boolean;
  logs: LogBoxLog[];
} | null>(null);

export function useLogs(): {
  selectedLogIndex: number;
  isDisabled: boolean;
  logs: LogBoxLog[];
} {
  const logs = React.useContext(LogContext);
  if (!logs) {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
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

    throw new Error('useLogs must be used within a LogProvider');
  }
  return logs;
}

export function useSelectedLog() {
  const { selectedLogIndex, logs } = useLogs();
  return logs[selectedLogIndex];
}
