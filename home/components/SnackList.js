/* @flow */

import React from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, View } from 'react-native';
import InfiniteScrollView from 'react-native-infinite-scroll-view';
import { withNavigation } from 'react-navigation';

import Colors from '../constants/Colors';
import SnackCard from './SnackCard';

@withNavigation
export default class ProjectList extends React.PureComponent {
  state = {
    isReady: false,
    isRefetching: false,
    isLoadingMore: false,
  };

  _isMounted: boolean;
  _readyTimer: any;

  componentDidMount() {
    this._isMounted = true;
    this._readyTimer = setTimeout(() => {
      this.setState({ isReady: true });
    }, 500);
  }

  componentWillUnmount() {
    clearTimeout(this._readyTimer);
    this._isMounted = false;
  }

  render() {
    return (
      <View style={{ flex: 1 }}>
        {this.state.isReady && this.props.data.snacks && this.props.data.snacks.length
          ? this._renderContent()
          : this._maybeRenderLoading()}
      </View>
    );
  }

  _maybeRenderLoading = () => {
    if (!this.state.isReady) {
      return (
        <View style={{ flex: 1, padding: 30, alignItems: 'center' }}>
          <ActivityIndicator />
        </View>
      );
    }
  };

  _renderContent = () => {
    return (
      <FlatList
        data={this.props.data.snacks}
        keyExtractor={this._extractKey}
        renderItem={this._renderItem}
        renderLoadingIndicator={() => <View />}
        renderScrollComponent={props => <InfiniteScrollView {...props} />}
        style={[{ flex: 1 }, !this.props.belongsToCurrentUser && styles.largeProjectCardList]}
        canLoadMore={this._canLoadMore()}
        onLoadMoreAsync={this._handleLoadMoreAsync}
      />
    );
  };

  _extractKey = item => {
    return item.id;
  };

  _handleLoadMoreAsync = async () => {
    if (this.state.isLoadingMore) {
      return;
    }

    try {
      this.setState({ isLoadingMore: true });
      await this.props.loadMoreAsync();
    } catch (e) {
      console.log({ e });
    } finally {
      this._isMounted && this.setState({ isLoadingMore: false });
    }
  };

  _canLoadMore = () => {
    // TODO: replace the code below this comment with the following line
    // once we have implemented snackCount
    // return this.props.data.snacks.length < this.props.data.snackCount;

    if (this.state.isLoadingMore) {
      return false;
    } else {
      return true;
    }
  };

  _renderItem = ({ item: snack, index }) => {
    return (
      <SnackCard
        key={index.toString()}
        projectName={snack.name}
        slug={snack.slug}
        projectUrl={snack.fullName}
        description={snack.description}
        fullWidthBorder
      />
    );
  };
}

const styles = StyleSheet.create({
  largeProjectCardList: {
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: Colors.greyBackground,
  },
  largeProjectCard: {
    marginBottom: 10,
  },
});
