import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { StyledText } from '../components/Text';
import FriendlyUrls from '../legacy/FriendlyUrls';
import DevIndicator from '../components/DevIndicator';

type Props = {
  task: { [key: string]: any };
};

class DevMenuTaskInfo extends React.PureComponent<Props, {}> {
  _maybeRenderDevServerName() {
    const { task } = this.props;
    const devServerName =
      task && task.manifest && task.manifest.developer ? task.manifest.developer.tool : null;

    if (devServerName) {
      return (
        <View style={styles.taskDevServerRow}>
          <DevIndicator style={styles.taskDevServerIndicator} isActive isNetworkAvailable />
          <Text style={styles.taskDevServerName}>{devServerName}</Text>
        </View>
      );
    }
    return null;
  }

  render() {
    const { task } = this.props;
    const taskUrl = task.manifestUrl ? FriendlyUrls.toFriendlyString(task.manifestUrl) : '';
    const iconUrl = task.manifest && task.manifest.iconUrl;
    const taskName = task.manifest && task.manifest.name;
    const taskNameStyles = taskName ? styles.taskName : [styles.taskName, { color: '#c5c6c7' }];
    const sdkVersion = task.manifest && task.manifest.sdkVersion;

    return (
      <View style={styles.taskMetaRow}>
        <View style={styles.taskIconColumn}>
          {iconUrl ? (
            <Image source={{ uri: iconUrl }} style={styles.taskIcon} />
          ) : (
            <View style={[styles.taskIcon, { backgroundColor: '#eee' }]} />
          )}
        </View>
        <View style={styles.taskInfoColumn}>
          <StyledText style={taskNameStyles} numberOfLines={1} lightColor="#595c68">
            {taskName ? taskName : 'Untitled Experience'}
          </StyledText>
          <Text style={[styles.taskUrl]} numberOfLines={1}>
            {taskUrl}
          </Text>
          {sdkVersion && (
            <StyledText style={styles.taskSdkVersion}>
              SDK: <Text style={styles.taskSdkVersionBold}>{sdkVersion}</Text>
            </StyledText>
          )}
          {this._maybeRenderDevServerName()}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  taskMetaRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  taskInfoColumn: {
    flex: 4,
    justifyContent: 'center',
  },
  taskIconColumn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskName: {
    backgroundColor: 'transparent',
    fontWeight: '700',
    fontSize: 16,
    marginTop: 14,
    marginBottom: 1,
    marginRight: 24,
  },
  taskUrl: {
    color: '#9ca0a6',
    backgroundColor: 'transparent',
    marginRight: 16,
    marginBottom: 2,
    marginTop: 1,
    fontSize: 11,
  },
  taskSdkVersion: {
    color: '#9ca0a6',
    fontSize: 11,
  },
  taskSdkVersionBold: {
    fontWeight: 'bold',
  },
  taskIcon: {
    width: 52,
    height: 52,
    marginTop: 12,
    marginRight: 10,
    alignSelf: 'center',
    backgroundColor: 'transparent',
  },
  taskDevServerRow: {
    flexDirection: 'row',
  },
  taskDevServerName: {
    fontSize: 11,
    color: '#9ca0a6',
    fontWeight: '700',
  },
  taskDevServerIndicator: {
    marginTop: 4,
    marginRight: 7,
  },
});

export default DevMenuTaskInfo;
