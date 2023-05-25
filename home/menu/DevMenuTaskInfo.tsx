import { Row, View, Text, Divider, Spacer } from 'expo-dev-client-components';
import React from 'react';
import { Image, StyleSheet } from 'react-native';

import DevIndicator from '../components/DevIndicator';
import FriendlyUrls from '../legacy/FriendlyUrls';

type Props = {
  task: { [key: string]: any };
};

export function DevMenuTaskInfo({ task }: Props) {
  const taskUrl = task.manifestUrl ? FriendlyUrls.toFriendlyString(task.manifestUrl) : '';
  const manifest = task.manifestString && JSON.parse(task.manifestString);
  const iconUrl = manifest && (manifest.iconUrl ?? manifest.extra?.expoClient?.iconUrl);
  const taskName = manifest && (manifest.name ?? manifest.extra?.expoClient?.name);
  const sdkVersion = manifest && (manifest.sdkVersion ?? manifest.extra?.expoClient?.sdkVersion);
  const runtimeVersion = manifest && manifest.runtimeVersion;

  const devServerName =
    manifest && manifest.extra?.expoGo?.developer ? manifest.extra.expoGo.developer.tool : null;

  return (
    <View>
      <Row bg="default" padding="medium">
        {!manifest?.metadata?.branchName && iconUrl ? (
          // EAS Update updates don't have icons
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
      <Divider />
      <View bg="default" padding="medium">
        {devServerName ? (
          <>
            <Text size="small" type="InterRegular">
              Connected to {devServerName}
            </Text>
            <Spacer.Vertical size="tiny" />
          </>
        ) : null}
        <Row align="center">
          {devServerName ? (
            <DevIndicator style={styles.taskDevServerIndicator} isActive isNetworkAvailable />
          ) : null}
          <Text type="InterRegular" size="medium" numberOfLines={1}>
            {taskUrl}
          </Text>
        </Row>
      </View>
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
  taskDevServerIndicator: {
    marginRight: 8,
  },
});
