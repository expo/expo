/* @flow */
import { useTheme } from '@react-navigation/native';
import dedent from 'dedent';
import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import InfiniteScrollView from 'react-native-infinite-scroll-view';

import Colors from '../constants/Colors';
import SharedStyles from '../constants/SharedStyles';
import FeatureFlags from '../FeatureFlags';
import PrimaryButton from './PrimaryButton';
import ProjectCard from './ProjectCard';
import SectionHeader from './SectionHeader';
import { StyledText } from './Text';

const NETWORK_ERROR_TEXT = dedent`
  Your connection appears to be offline.
  Check back when you have a better connection.
`;

const SERVER_ERROR_TEXT = dedent`
  An unexpected server error has occurred.
  Sorry about this. We will resolve the issue as soon as quickly as possible.
`;

class ExploreTab extends React.Component {
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
    const isConnectionError = this.props.data?.error?.message?.includes('No connection available');

    return (
      <View style={{ flex: 1, alignItems: 'center', paddingTop: 30 }}>
        <StyledText
          style={SharedStyles.noticeDescriptionText}
          lightColor="rgba(36, 44, 58, 0.7)"
          darkColor="#ccc">
          {isConnectionError ? NETWORK_ERROR_TEXT : SERVER_ERROR_TEXT}
        </StyledText>

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
        <ActivityIndicator color={Colors.light.tintColor} />
      </View>
    );
  }

  _renderContent() {
    let extraOptions = {};
    const { theme } = this.props;

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
        style={[
          styles.container,
          { backgroundColor: theme.dark ? '#000' : Colors.light.greyBackground },
        ]}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 5 }}
        {...extraOptions}
      />
    );
  }

  _renderHeader = () => {
    const { listTitle } = this.props;
    return listTitle ? <SectionHeader title={listTitle} /> : <View />;
  };

  _renderItem = ({ item: app, index }: { item: Object, index: number }) => {
    return (
      <ProjectCard
        key={index.toString()}
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

export default props => {
  const theme = useTheme();

  return <ExploreTab {...props} theme={theme} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: FeatureFlags.HIDE_EXPLORE_TABS && Platform.OS === 'ios' ? 5 : 10,
  },
});
