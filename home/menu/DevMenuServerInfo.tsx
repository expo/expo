import { Row, View, Text, Spacer } from 'expo-dev-client-components';
import React from 'react';
import { StyleSheet } from 'react-native';

import DevIndicator from '../components/DevIndicator';
import FriendlyUrls from '../legacy/FriendlyUrls';

type Props = {
  task: { [key: string]: any };
};

export function DevMenuServerInfo({ task }: Props) {
  const manifest = task.manifestString && JSON.parse(task.manifestString);
  const taskUrl = task.manifestUrl ? FriendlyUrls.toFriendlyString(task.manifestUrl) : '';
  const devServerName =
    manifest && manifest.extra?.expoGo?.developer ? manifest.extra.expoGo.developer.tool : null;

  return (
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
  );
}

const styles = StyleSheet.create({
  taskDevServerIndicator: {
    marginRight: 8,
  },
});
