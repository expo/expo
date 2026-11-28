import { Observe } from 'expo-observe';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import {
  type ExampleLogLevel,
  type ObserveIntegrationExampleConfig,
  isJavaScriptIntegrationSetUp,
  isNativeIntegrationSetUp,
  logInJavaScript,
  logInNative,
  OBSERVE_INTEGRATION_EXAMPLE,
} from '@/modules/observe-integration-example';
import { observeConfig } from '@/utils/observeConfig';
import { useTheme } from '@/utils/theme';

function configureExample(config: boolean | ObserveIntegrationExampleConfig) {
  Observe.configure({
    ...observeConfig,
    integrations: { ...observeConfig.integrations, [OBSERVE_INTEGRATION_EXAMPLE]: config },
  });
}

function readStatus() {
  return {
    javaScript: isJavaScriptIntegrationSetUp(),
    native: isNativeIntegrationSetUp(),
  };
}

export default function ObserveIntegrationScreen() {
  const theme = useTheme();
  const [status, setStatus] = useState(readStatus);
  const [lastReport, setLastReport] = useState('none');

  function configure(config: boolean | ObserveIntegrationExampleConfig) {
    configureExample(config);
    setStatus(readStatus());
  }

  function log(side: 'JavaScript' | 'native', level: ExampleLogLevel) {
    const message = `Example ${level} from ${side} (${new Date().toISOString()})`;
    const recorded =
      side === 'JavaScript' ? logInJavaScript(level, message) : logInNative(level, message);
    setLastReport(`${side} ${level}: ${recorded ? 'recorded' : 'not recorded'}`);
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background.screen }]}
      contentContainerStyle={styles.content}>
      <Text style={[styles.description, { color: theme.text.secondary }]}>
        An example library that registers an Observe integration with expo-observe-interface, with a
        JavaScript integration and a native integration under the same name. Each button that
        configures Observe keeps the config of the root layout and changes only the `
        {OBSERVE_INTEGRATION_EXAMPLE}` key.
      </Text>
      <Text style={[styles.status, { color: theme.text.default }]}>
        {`JavaScript integration: ${status.javaScript ? 'set up' : 'not set up'}\n` +
          `Native integration: ${status.native ? 'set up' : 'not set up'}\n` +
          `Last report: ${lastReport}`}
      </Text>
      <Button title="Enable" onPress={() => configure(true)} />
      <Button
        title="Enable with warnings"
        description="Changes the config, so both integrations are set up again"
        onPress={() => configure({ reportWarnings: true })}
      />
      <Button title="Disable" onPress={() => configure(false)} />
      <Button
        title="Log a JavaScript error"
        theme="secondary"
        onPress={() => log('JavaScript', 'error')}
      />
      <Button
        title="Log a JavaScript warning"
        theme="secondary"
        onPress={() => log('JavaScript', 'warn')}
      />
      <Button title="Log a native error" theme="secondary" onPress={() => log('native', 'error')} />
      <Button
        title="Log a native warning"
        theme="secondary"
        onPress={() => log('native', 'warn')}
      />
      <Button title="Refresh status" theme="tertiary" onPress={() => setStatus(readStatus())} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: Platform.select({ ios: 30, android: 150 }),
  },
  description: {
    fontSize: 14,
    marginBottom: 20,
  },
  status: {
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
    marginBottom: 20,
  },
});
