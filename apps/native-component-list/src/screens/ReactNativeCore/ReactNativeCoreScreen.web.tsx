import * as React from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';

export default class ReactNativeCoreScreen extends React.Component {
  state = {
    isRefreshing: false,
  };

  _listView?: React.Component;

  render() {
    return (
      <SectionList
        ref={view => (this._listView = view!)}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl refreshing={this.state.isRefreshing} onRefresh={this._onRefresh} />
        }
        keyExtractor={(item, index) => `${index}`}
        removeClippedSubviews={false}
        contentContainerStyle={{ backgroundColor: '#fff' }}
        sections={[
          { title: 'Vertical ScrollView, RefreshControl', data: [this._renderRefreshControl] },
          { title: 'Horizontal ScrollView', data: [this._renderHorizontalScrollView] },
        ]}
        renderItem={this._renderItem}
        renderSectionHeader={this._renderSectionHeader}
      />
    );
  }

  _renderItem = ({ item }: { item: () => JSX.Element }) => item();

  _onRefresh = () => {
    this.setState({ isRefreshing: true });
    setTimeout(() => {
      this.setState({ isRefreshing: false });
    }, 3000);
  };

  _scrollToTop = () => {
    // @ts-ignore
    this._listView!.scrollTo({ x: 0, y: 0 });
  };

  _renderRefreshControl = () => (
    <View style={{ padding: 10 }}>
      <Text>
        This screen is a vertical ScrollView, try the pull to refresh gesture to see the
        RefreshControl.
      </Text>
    </View>
  );

  _renderHorizontalScrollView = () => {
    const imageStyle = {
      width: Layout.window.width,
      height: Layout.window.width / 2,
    };

    return (
      <ScrollView pagingEnabled directionalLockEnabled horizontal>
        <Image
          source={require('../../../assets/images/example1.jpg')}
          style={imageStyle}
          resizeMode="cover"
        />
        <Image
          source={require('../../../assets/images/example2.jpg')}
          style={imageStyle}
          resizeMode="cover"
        />
        <Image
          source={require('../../../assets/images/example3.jpg')}
          style={imageStyle}
          resizeMode="cover"
        />
      </ScrollView>
    );
  };

  _renderSectionHeader = ({ section }: any) => (
    <View style={styles.sectionHeader}>
      <Text>{section.title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 100,
  },
  sectionHeader: {
    backgroundColor: 'rgba(245,245,245,1)',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  button: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 3,
    backgroundColor: Colors.tintColor,
    marginRight: 10,
  },
  buttonText: {
    color: '#fff',
  },
});
