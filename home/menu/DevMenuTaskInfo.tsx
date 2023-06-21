import { Row, View, Text } from 'expo-dev-client-components';
import React from 'react';
import { Image, StyleSheet } from 'react-native';

type Props = {
  task: { [key: string]: any };
};

export function DevMenuTaskInfo({ task }: Props) {
  const manifest = task.manifestString && JSON.parse(task.manifestString);
  const iconUrl = manifest && (manifest.iconUrl ?? manifest.extra?.expoClient?.iconUrl);
  const taskName = manifest && (manifest.name ?? manifest.extra?.expoClient?.name);
  const sdkVersion = manifest && (manifest.sdkVersion ?? manifest.extra?.expoClient?.sdkVersion);
  const runtimeVersion = manifest && manifest.runtimeVersion;

  return (
    <View>
      <Row bg="default" padding="medium">
        {!manifest?.metadata?.branchName && iconUrl ? (
          // EAS Updates don't have icons
          <Image source={{ uri: iconUrl }} style={styles.taskIcon} />
        ) : null}
        <View flex="1" style={{ justifyContent: 'center' }}>
          <Text type="InterBold" color="default" size="medium" numberOfLines={1}>
            {taskName ? taskName : 'Untitled Experience'}
          </Text>
          {sdkVersion && (
            <Text size="small" type="InterRegular" color="secondary">
              SDK version:{' '}
              <Text type="InterSemiBold" color="secondary" size="small">
                {sdkVersion}
              </Text>
            </Text>
          )}
          {runtimeVersion && (
            <Text size="small" type="InterRegular" color="secondary">
              Runtime version:{' '}
              <Text type="InterSemiBold" color="secondary" size="small">
                {runtimeVersion}
              </Text>
            </Text>
          )}
        </View>
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  taskIcon: {
    width: 40,
    height: 40,
    marginRight: 8,
    borderRadius: 8,
    alignSelf: 'center',
    backgroundColor: 'transparent',
  },
});
