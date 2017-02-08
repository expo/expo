import React from 'react';
import {
  ActivityIndicator,
  ListView,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import InfiniteScrollView from 'react-native-infinite-scroll-view';

import dedent from 'dedent';

import Colors from '../constants/Colors';
import FeatureFlags from '../../FeatureFlags';
import ProjectCard from './ProjectCard';
import PrimaryButton from './PrimaryButton';
import SharedStyles from '../constants/SharedStyles';

const NETWORK_ERROR_TEXT = dedent(`
  Your connection appears to be offline.
  Get out of the subway tunnel or connect to a better wifi network and check back.
`);

const SERVER_ERROR_TEXT = dedent(`
  An unexpected server error has occurred.
  Sorry about this. We will resolve the issue as soon as quickly as possible.
`);

export default class ExploreTab extends React.Component {
  state = {
    dataSource: new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2 }),
    isRefetching: false,
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.data) {
      return;
    }

    if (nextProps.data.apps !== this.props.data.apps) {
      let dataSource = this.state.dataSource.cloneWithRows(nextProps.data.apps);
      this.setState({dataSource});
    }
  }

  render() {
    if (this.props.data.loading || this.state.isRefetching && !this.props.data.apps) {
      return this._renderLoading();
    } else if (this.props.data.error && !this.props.data.apps) {
      return this._renderError();
    } else {
      return this._renderContent();
    }
  }

  _renderError() {
    let isConnectionError = this.props.data.error.message.includes('No connection available');

    return (
      <View style={{flex: 1, alignItems: 'center', paddingTop: 30}}>
        <Text style={SharedStyles.noticeDescriptionText}>
          {isConnectionError ? NETWORK_ERROR_TEXT : SERVER_ERROR_TEXT}
        </Text>

        <PrimaryButton
          plain
          onPress={this._refetchDataAsync}
          fallback={TouchableOpacity}>
          Try again
        </PrimaryButton>
      </View>
    );
  }

  _refetchDataAsync = async () => {
    try {
      this.setState({isRefetching: true});
      await this.props.data.refetch()
    } catch(e) {
      console.log({e});
      // Error!
    } finally {
      this.setState({isRefetching: false});
    }
  }

  _renderLoading() {
    return (
      <View style={{flex: 1, alignItems: 'center', paddingTop: 30}}>
        <ActivityIndicator />
      </View>
    );
  }

  _renderContent() {
    let extraOptions = {};

    if (FeatureFlags.INFINITE_SCROLL_EXPLORE_TABS) {
      extraOptions = {
        renderScrollComponent: (props) => <InfiniteScrollView {...props} />,
        canLoadMore: true,
        onLoadMoreAsync: this.props.loadMoreAsync,
      }
    }

    return (
      <ListView
        dataSource={this.state.dataSource}
        renderRow={this._renderRow}
        style={styles.container}
        {...extraOptions}
      />
    );
  }

  _renderRow = (app, i) => {
    return (
      <ProjectCard
        key={i}
        isLikedByMe={app.isLikedByMe}
        likeCount={app.likeCount}
        id={app.id}
        iconUrl={app.iconUrl}
        projectName={app.name}
        projectUrl={app.fullName}
        username={app.packageUsername}
        description={app.description}
        onPressUsername={this.props.onPressUsername}
      />
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 15,
    backgroundColor: Colors.greyBackground,
    borderRightWidth: 1,
    borderRightColor: '#f6f6f6',
  },
});
