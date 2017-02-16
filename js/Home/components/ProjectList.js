import React from 'react';
import { ActivityIndicator, ListView, StyleSheet, Text, View } from 'react-native';
import InfiniteScrollView from 'react-native-infinite-scroll-view';
import { withNavigation } from '@exponent/ex-navigation';

import Colors from '../constants/Colors';
import ProjectCard from './ProjectCard';
import SmallProjectCard from './SmallProjectCard';

@withNavigation
export default class ProjectList extends React.Component {
  state = {
    dataSource: new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 }),
    isRefetching: false,
    isLoadingMore: false,
  };

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.data) {
      return;
    }

    if (nextProps.data.apps !== this.props.data.apps) {
      let dataSource = this.state.dataSource.cloneWithRows(nextProps.data.apps);
      this.setState({ dataSource });
    }
  }

  render() {
    return (
      <View style={{ flex: 1 }}>
        {this.props.data.apps && this.props.data.apps.length ? this._renderContent() : this._maybeRenderLoading()}
      </View>
    );
  }

  _maybeRenderLoading = () => {
    if (!this.props.data.loading) {
      return null;
    }

    return (
      <View style={{ flex: 1, padding: 30, alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  };

  _renderContent = () => {
    return (
      <ListView
        dataSource={this.state.dataSource}
        renderRow={this._renderRow}
        style={[{ flex: 1 }, !this.props.belongsToCurrentUser && styles.largeProjectCardList]}
        renderScrollComponent={props => <InfiniteScrollView {...props} />}
        canLoadMore={this._canLoadMore()}
        onLoadMoreAsync={this._handleLoadMoreAsync}
        removeClippedSubviews={false}
      />
    );
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
    return this.props.data.apps.length < this.props.data.appCount;
  };

  _renderRow = (app, i) => {
    if (this.props.belongsToCurrentUser) {
      return (
        <SmallProjectCard
          key={i}
          hideUsername
          iconUrl={app.iconUrl}
          likeCount={app.likeCount}
          projectName={app.name}
          slug={app.packageName}
          projectUrl={app.fullName}
          fullWidthBorder
        />
      );
    } else {
      return (
        <ProjectCard
          key={i}
          style={styles.largeProjectCard}
          isLikedByMe={app.isLikedByMe}
          likeCount={app.likeCount}
          id={app.id}
          iconUrl={app.iconUrl}
          projectName={app.name}
          projectUrl={app.fullName}
          username={app.packageUsername}
          description={app.description}
          onPressUsername={this._handlePressUsername}
        />
      );
    }
  };

  _handlePressUsername = username => {
    this.props.navigator.push('profile', { username });
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
