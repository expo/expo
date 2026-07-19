import * as Clipboard from 'expo-clipboard';
import type { ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

type Props = {
  testID: string;
  screenshotOutputPath?: string;
  mode?: 'normalize' | 'keep-originals';
  style?: ViewStyle;
  children: ReactNode;
};

export function E2EViewShotContainer({
  testID,
  style,
  children,
  screenshotOutputPath = 'TODO_specify_output_path',
  mode = 'normalize',
}: Props) {
  const handleCopyViewShotYaml = async () => {
    const yaml = `- runFlow:
    file: ../_nested-flows/viewshot-comparison.yaml
    env:
      screenshotOutputPath: '${screenshotOutputPath}'
      testID: '${testID}'
      mode: '${mode}'`;

    await Clipboard.setStringAsync(yaml);
  };

  return (
    <View style={style}>
      <TouchableOpacity style={styles.copyButton} onPress={handleCopyViewShotYaml}>
        <Text style={styles.copyButtonText}>Copy viewshot YAML</Text>
      </TouchableOpacity>

      <View testID={testID}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {},
  copyButton: {
    alignSelf: 'flex-start',
    flex: 0,
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
});
