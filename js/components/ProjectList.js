/* @flow */

import React from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, View } from 'react-native';
import InfiniteScrollView from 'react-native-infinite-scroll-view';
import { withNavigation } from 'react-navigation';

import Colors from '../constants/Colors';
import ProjectCard from './ProjectCard';
import SmallProjectCard from './SmallProjectCard';

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
        {this.state.isReady && this.props.data.apps && this.props.data.apps.length
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
        data={this.props.data.apps}
        keyExtractor={this._extractKey}
        renderItem={this._renderItem}
        style={[{ flex: 1 }, !this.props.belongsToCurrentUser && styles.largeProjectCardList]}
        renderScrollComponent={props => {
          // note(brent): renderScrollComponent is passed on to
          // InfiniteScrollView so it renders itself again and the result is two
          // loading indicators. So we need to detect if we're in
          // InfiniteScrollView by checking for a prop that is passed in to it,
          // in this case we'll just check for props.renderLoadingIndicator.
          // This should be fixed upstream in InfiniteScrollView, so if InfiniteScrollView
          // is itself the scroll component being rendered it doesn't once again render
          // the scroll component.
          if (props.renderLoadingIndicator) {
            return <ScrollView {...props} />;
          } else {
            return <InfiniteScrollView {...props} />
          }
        }}
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
    return this.props.data.apps.length < this.props.data.appCount;
  };

  _renderItem = ({ item: app, index }) => {
    if (this.props.belongsToCurrentUser) {
      return (
        <SmallProjectCard
          key={index.toString()}
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
          key={index}
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

  _handlePressUsername = (username: string) => {
    this.props.navigation.navigate('Profile', { username });
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
