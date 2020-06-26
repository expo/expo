/* @flow */

import React from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, View } from 'react-native';
import InfiniteScrollView from 'react-native-infinite-scroll-view';
import { useTheme, withNavigation } from 'react-navigation';

import Colors from '../constants/Colors';
import ProjectCard from './ProjectCard';
import ProjectListItem from './ProjectListItem';

@withNavigation
class ProjectList extends React.PureComponent {
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
          <ActivityIndicator color={Colors.light.tintColor} />
        </View>
      );
    }
  };

  _renderContent = () => {
    const { theme } = this.props;

    return (
      <FlatList
        data={this.props.data.apps}
        keyExtractor={this._extractKey}
        renderItem={this._renderItem}
        style={[
          { flex: 1 },
          !this.props.belongsToCurrentUser && styles.largeProjectCardList,
          { backgroundColor: theme === 'dark' ? '#000' : Colors.light.greyBackground },
        ]}
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
            return <InfiniteScrollView {...props} />;
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
        <ProjectListItem
          key={index.toString()}
          url={app.fullName}
          image={app.iconUrl}
          title={app.name}
          subtitle={app.packageName || app.fullName}
          last={index === this.props.data.apps.length - 1}
        />
      );
    } else {
      return (
        <ProjectCard
          key={index}
          style={styles.largeProjectCard}
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

export default props => {
  const theme = useTheme();

  return <ProjectList {...props} theme={theme} />;
};

const styles = StyleSheet.create({
  largeProjectCardList: {
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: Colors.light.greyBackground,
  },
  largeProjectCard: {
    marginBottom: 10,
  },
});
