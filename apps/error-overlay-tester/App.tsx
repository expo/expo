import { LogBoxInspectorContainer } from '@expo/metro-runtime/src/error-overlay/ErrorOverlay';
import { LogContext } from '@expo/metro-runtime/src/error-overlay/Data/LogContext';

export default function App() {
  return (
    <LogContext.Provider
      value={{
        selectedLogIndex: 0,
        isDisabled: false,
        logs: [],
      }}>
      <LogBoxInspectorContainer />
    </LogContext.Provider>
  );
}
