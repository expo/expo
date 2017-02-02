import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  ListView,
  View,
} from 'react-native';
import InfiniteScrollView from 'react-native-infinite-scroll-view';

import Colors from '../constants/Colors';
import ProjectCard from './ProjectCard';
import FakeCards from '../FakeCards';

export default class ExploreTab extends React.Component {
  state = {
    dataSource: new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2 }),
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.data && nextProps.data.apps) {
      let dataSource = this.state.dataSource.cloneWithRows(nextProps.data.apps);
      this.setState({dataSource});
    }
  }

  render() {
    return this.props.data.loading ? this._renderLoading() : this._renderContent();
  }

  _renderLoading() {
    return (
      <View style={{flex: 1, alignItems: 'center', paddingTop: 30}}>
        <ActivityIndicator />
      </View>
    );
  }

  _renderContent() {
    return (
      <ListView
        renderScrollComponent={props => <InfiniteScrollView {...props} />}
        dataSource={this.state.dataSource}
        renderRow={this._renderRow}
        style={styles.container}
        canLoadMore={true}
        onLoadMoreAsync={this.props.loadMoreAsync}
      />
    );
  }

  _renderRow = (app, i) => {
    return (
      <ProjectCard
        key={i}
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
