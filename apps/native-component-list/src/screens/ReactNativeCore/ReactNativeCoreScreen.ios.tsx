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
import { ScrollView as NavigationScrollView } from 'react-native-gesture-handler';

import Layout from '../../constants/Layout';

export default class ReactNativeCoreScreen extends React.Component<{}> {
  state = {
    isRefreshing: false,
  };

  sections: { title: string; data: (() => JSX.Element)[] }[];

  _sectionList?: React.Component;

  constructor(props: any) {
    super(props);

    this.sections = [
      { title: 'Vertical ScrollView, RefreshControl', data: [this._renderRefreshControl] },
      { title: 'Horizontal ScrollView', data: [this._renderHorizontalScrollView] },
    ];
  }

  render() {
    return (
      <SectionList
        ref={view => (this._sectionList = view!)}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl refreshing={this.state.isRefreshing} onRefresh={this._onRefresh} />
        }
        keyExtractor={(item, index) => `${index}`}
        removeClippedSubviews={false}
        contentContainerStyle={{ backgroundColor: '#fff' }}
        sections={this.sections}
        renderItem={this._renderItem}
        renderScrollComponent={props => <NavigationScrollView {...props} />}
        renderSectionHeader={this._renderSectionHeader}
      />
    );
  }

  _onRefresh = () => {
    this.setState({ isRefreshing: true });
    setTimeout(() => {
      this.setState({ isRefreshing: false });
    }, 3000);
  };

  _scrollToTop = () => {
    // @ts-ignore
    this._sectionList!.scrollTo({ x: 0, y: 0 });
  };

  _renderRefreshControl = () => {
    return (
      <View style={{ padding: 10 }}>
        <Text>
          This screen is a vertical ScrollView, try the pull to refresh gesture to see the
          RefreshControl.
        </Text>
      </View>
    );
  };

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

  _renderItem = ({ item }: { item: () => JSX.Element }) => item();

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
});
