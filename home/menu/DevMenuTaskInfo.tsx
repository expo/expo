import Constants from 'expo-constants';
import { Row, View, Text } from 'expo-dev-client-components';
import React from 'react';
import { Image, StyleSheet } from 'react-native';

type Props = {
  task: { manifestUrl: string; manifestString: string };
};

function stringOrUndefined<T>(anything: T): string | undefined {
  if (typeof anything === 'string') {
    return anything;
  }

  return undefined;
}

function getInfoFromManifest(
  manifest: NonNullable<typeof Constants.manifest | typeof Constants.manifest2>
): {
  iconUrl?: string;
  taskName?: string;
  sdkVersion?: string;
  runtimeVersion?: string;
  isVerified?: boolean;
} {
  if ('metadata' in manifest) {
    // modern manifest
    return {
      iconUrl: undefined, // no icon for modern manifests
      taskName: manifest.extra?.expoClient?.name,
      sdkVersion: manifest.extra?.expoClient?.sdkVersion,
      runtimeVersion: stringOrUndefined(manifest.runtimeVersion),
      isVerified: (manifest as any).isVerified,
    };
  } else {
    return {
      iconUrl: manifest.iconUrl,
      taskName: manifest.name,
      sdkVersion: manifest.sdkVersion,
      runtimeVersion: stringOrUndefined(manifest.runtimeVersion),
      isVerified: manifest.isVerified,
    };
  }
}

export function DevMenuTaskInfo({ task }: Props) {
  const manifest = task.manifestString
    ? (JSON.parse(task.manifestString) as typeof Constants.manifest | typeof Constants.manifest2)
    : null;
  const manifestInfo = manifest ? getInfoFromManifest(manifest) : null;

  return (
    <View>
      <Row bg="default" padding="medium">
        {manifestInfo?.iconUrl ? (
          <Image source={{ uri: manifestInfo.iconUrl }} style={styles.taskIcon} />
        ) : null}
        <View flex="1" style={{ justifyContent: 'center' }}>
          <Text type="InterBold" color="default" size="medium" numberOfLines={1}>
            {manifestInfo?.taskName ? manifestInfo.taskName : 'Untitled Experience'}
          </Text>
          {manifestInfo?.sdkVersion && (
            <Text size="small" type="InterRegular" color="secondary">
              SDK version:{' '}
              <Text type="InterSemiBold" color="secondary" size="small">
                {manifestInfo.sdkVersion}
              </Text>
            </Text>
          )}
          {manifestInfo?.runtimeVersion && (
            <Text size="small" type="InterRegular" color="secondary">
              Runtime version:{' '}
              <Text type="InterSemiBold" color="secondary" size="small">
                {manifestInfo.runtimeVersion}
              </Text>
            </Text>
          )}
          {!manifestInfo?.isVerified && (
            <Text size="small" type="InterRegular" color="error">
              Unverified App
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
