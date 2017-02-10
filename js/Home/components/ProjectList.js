import React from 'react';
import {
  ActivityIndicator,
  ListView,
  Text,
  View,
} from 'react-native';
import InfiniteScrollView from 'react-native-infinite-scroll-view';

import SmallProjectCard from './SmallProjectCard';

export default class ProjectList extends React.Component {
  state = {
    dataSource: new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2 }),
    isRefetching: false,
    isLoadingMore: false,
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
    return (
      <View style={{flex: 1}}>
        { this.props.data.apps && this.props.data.apps.length ?
          this._renderContent() :
          this._maybeRenderLoading() }
      </View>
    );
  }

  _maybeRenderLoading = () => {
    if (!this.props.data.loading) {
      return null;
    }

    return (
      <View style={{flex: 1, padding: 30, alignItems: 'center'}}>
        <ActivityIndicator />
      </View>
    );
  }

  _renderContent = () => {
    return (
      <ListView
        dataSource={this.state.dataSource}
        renderRow={this._renderRow}
        style={{flex: 1}}
        renderScrollComponent={(props) => <InfiniteScrollView {...props} />}
        canLoadMore={this._canLoadMore()}
        onLoadMoreAsync={this._handleLoadMoreAsync}
      />
    );
  }

  _handleLoadMoreAsync = async () => {
    if (this.state.isLoadingMore) {
      return;
    }

    try {
      this.setState({isLoadingMore: true});
      await this.props.loadMoreAsync();
    } catch(e) {
      console.log({e});
    } finally {
      this.setState({isLoadingMore: false});
    }
  }

  _canLoadMore = () => {
    return this.props.data.apps.length < this.props.data.appCount;
  }

  _renderRow = (app, i) => {
    if (this.props.data.belongsToCurrentUser) {
      return (
        <SmallProjectCard
          key={i}
          iconUrl={app.iconUrl}
          projectName={app.packageName}
          projectUrl={app.fullName}
          fullWidthBorder
        />
      );
    } else {

    }
  }
}
