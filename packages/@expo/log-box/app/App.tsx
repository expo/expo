import * as React from 'react';
import { LogBoxLog } from '../src/Data/LogBoxLog';
import { parseLogBoxException } from '../src/Data/parseLogBoxLog';
import LogBoxPolyfillDOM from '../src/logbox-dom-polyfill';
import { View, Text } from 'react-native';

const logs: LogBoxLog[] = [
  new LogBoxLog(parseLogBoxException({
    message: "Test error",
    originalMessage: undefined,
    name: undefined,
    componentStack: undefined,
    id: -1,
    isComponentError: false,
    isFatal: false,
    stack: [],
  })),
];

/**
 * Empty App skeleton used as a workaround to prebuilt the Expo LogBox DOM Component.
 * (DOM Components are build during `expo export:embed`)
 *
 * Also used for the DOM Component UI preview via `yarn start`.
 */
export default function App() {
  const [showSandboxWarning, setSandboxWarningVisibility] = React.useState(true);
  return (
    <>
      { showSandboxWarning &&
        <View style={{ position: 'absolute', padding: 16, backgroundColor: '#E9D502', zIndex: 10000, borderRadius: 8, top: 16, left: 16, flexDirection: 'row', gap: 8 }}>
          <Text style={{fontFamily: "BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"}} >This is @expo/log-box development sandbox.</Text>
          <Text style={{fontWeight: 'bold'}} onPress={() => setSandboxWarningVisibility(false)}>Close</Text>
        </View>
      }
      <LogBoxPolyfillDOM
        logs={logs}

        // LogBoxData actions props
        onDismiss={() => { throw new Error("`onDismiss` placeholder, should never be called."); }}
        onChangeSelectedIndex={() => { throw new Error("`onChangeSelectedIndex` placeholder, should never be called."); }}

        // Environment polyfill props
        platform={process.env.EXPO_OS}
        devServerUrl={undefined}

        // Common actions props
        fetchTextAsync={() => Promise.reject(new Error('`fetchTextAsync` placeholder, should never be called.'))}

        // LogBox UI actions props
        onMinimize={() => { throw new Error("`onMinimize` placeholder, should never be called."); }}
        onReload={() => { throw new Error('`onReload` placeholder, should never be called.'); }}
        onCopyText={() => { throw new Error('`onCopyText` placeholder, should never be called.'); }}

        // DOM props
        dom={{}}
      />
    </>
  );
}
