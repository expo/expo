import React from 'react';

import { LogBoxLog } from './LogBoxLog';

import * as FIXTURES from '@expo/metro-runtime/fixtures/log-box-error-fixtures';

// Context provider for Array<LogBoxLog>

const IS_TESTING = true;

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

  if (IS_TESTING) {
    console.log('USING LOGBOX FIXTURE. INTERACTIONS MAY NOT WORK AS EXPECTED');
    // HACK: This is here for testing during UI development of the LogBox
    return {
      selectedLogIndex: 0,
      isDisabled: false,
      logs: FIXTURES.react_element_type_is_invalid,
      // logs: FIXTURES.react_each_child_in_a_list_should_have_a_unique_key_prop,
      // logs: FIXTURES.build_error_module_not_found,
      // logs: FIXTURES.undefined_is_not_a_function_runtime,
    };
  }

  if (!logs) {
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

    throw new Error('useLogs must be used within a LogContext.Provider');
  }
  return logs;
}

export function useSelectedLog() {
  const { selectedLogIndex, logs } = useLogs();
  return logs[selectedLogIndex];
}
