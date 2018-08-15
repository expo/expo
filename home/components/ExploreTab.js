/* @flow */

import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  TouchableOpacity,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import InfiniteScrollView from 'react-native-infinite-scroll-view';

import dedent from 'dedent';

import Colors from '../constants/Colors';
import FeatureFlags from '../FeatureFlags';
import ProjectCard from './ProjectCard';
import PrimaryButton from './PrimaryButton';
import SharedStyles from '../constants/SharedStyles';

const NETWORK_ERROR_TEXT = dedent`
  Your connection appears to be offline.
  Get out of the subway tunnel or connect to a better wifi network and check back.
`;

const SERVER_ERROR_TEXT = dedent`
  An unexpected server error has occurred.
  Sorry about this. We will resolve the issue as soon as quickly as possible.
`;

export default class ExploreTab extends React.Component {
  state = {
    isRefetching: false,
  };

  render() {
    if (this.props.data.loading || (this.state.isRefetching && !this.props.data.apps)) {
      return this._renderLoading();
    } else if (this.props.data.error && !this.props.data.apps) {
      return this._renderError();
    } else {
      return this._renderContent();
    }
  }

  _renderError() {
    // NOTE(brentvatne): sorry for this
    let isConnectionError = this.props.data.error.message.includes('No connection available');

    return (
      <View style={{ flex: 1, alignItems: 'center', paddingTop: 30 }}>
        <Text style={SharedStyles.noticeDescriptionText}>
          {isConnectionError ? NETWORK_ERROR_TEXT : SERVER_ERROR_TEXT}
        </Text>

        <PrimaryButton plain onPress={this._refetchDataAsync} fallback={TouchableOpacity}>
          Try again
        </PrimaryButton>
      </View>
    );
  }

  _refetchDataAsync = async () => {
    try {
      this.setState({ isRefetching: true });
      await this.props.data.refetch();
    } catch (e) {
      console.log({ e });
      // Error!
    } finally {
      this.setState({ isRefetching: false });
    }
  };

  _renderLoading() {
    return (
      <View style={{ flex: 1, alignItems: 'center', paddingTop: 30 }}>
        <ActivityIndicator />
      </View>
    );
  }

  _renderContent() {
    let extraOptions = {};

    if (FeatureFlags.INFINITE_SCROLL_EXPLORE_TABS) {
      extraOptions = {
        renderScrollComponent: props => <InfiniteScrollView {...props} />,
        canLoadMore: true,
        onLoadMoreAsync: this.props.loadMoreAsync,
      };
    }

    return (
      <FlatList
        data={this.props.data.apps}
        ListHeaderComponent={this._renderHeader}
        renderItem={this._renderItem}
        style={styles.container}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 5 }}
        {...extraOptions}
      />
    );
  }

  _renderHeader = () => {
    if (this.props.listTitle) {
      return (
        <View style={SharedStyles.sectionLabelContainer}>
          <Text style={SharedStyles.sectionLabelText}>{this.props.listTitle}</Text>
        </View>
      );
    } else {
      return <View />;
    }
  };

  _renderItem = ({ item: app, index }: { item: Object, index: number }) => {
    return (
      <ProjectCard
        key={index.toString()}
        isLikedByMe={app.isLikedByMe}
        likeCount={app.likeCount}
        id={app.id}
        iconUrl={app.iconUrl}
        projectName={app.name}
        projectUrl={app.fullName}
        username={app.packageUsername}
        description={app.description}
        onPressUsername={this.props.onPressUsername}
        style={{ marginBottom: 10 }}
      />
    );
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: FeatureFlags.HIDE_EXPLORE_TABS && Platform.OS === 'ios' ? 5 : 10,
    backgroundColor: Colors.greyBackground,
    borderRightWidth: 1,
    borderRightColor: '#f6f6f6',
  },
});
