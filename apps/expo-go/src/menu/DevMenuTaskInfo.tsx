import Ionicons from '@expo/vector-icons/build/Ionicons';
import Constants from 'expo-constants';
import { Row, View, Text, useExpoTheme } from 'expo-dev-client-components';
import React from 'react';
import { Image, Linking, StyleSheet, TouchableOpacity } from 'react-native';

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
      // @ts-expect-error iconUrl exists only for local development
      iconUrl: manifest?.extra?.expoClient?.iconUrl,
      taskName: manifest.extra?.expoClient?.name,
      sdkVersion: manifest.extra?.expoClient?.sdkVersion,
      runtimeVersion: stringOrUndefined(manifest.runtimeVersion),
      isVerified: (manifest as any).isVerified,
    };
  } else {
    // no properties for bare manifests
    return {
      iconUrl: undefined,
      taskName: undefined,
      sdkVersion: undefined,
      runtimeVersion: undefined,
      isVerified: undefined,
    };
  }
}

export function DevMenuTaskInfo({ task }: Props) {
  const theme = useExpoTheme();

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
            <TouchableOpacity
              onPress={() => Linking.openURL('https://expo.fyi/unverified-app-expo-go')}>
              <Row
                bg="warning"
                border="warning"
                rounded="medium"
                padding="0"
                align="center"
                style={{
                  alignSelf: 'flex-start',
                  marginTop: 3,
                }}>
                <Ionicons
                  name="warning"
                  size={14}
                  color={theme.text.warning}
                  lightColor={theme.text.warning}
                  darkColor={theme.text.warning}
                  style={{
                    marginHorizontal: 4,
                  }}
                />
                <Text
                  color="warning"
                  type="InterSemiBold"
                  size="small"
                  style={{
                    marginRight: 4,
                  }}>
                  Unverified
                </Text>
              </Row>
            </TouchableOpacity>
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
