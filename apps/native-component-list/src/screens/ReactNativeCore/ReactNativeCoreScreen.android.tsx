import * as React from 'react';
import {
  DrawerLayoutAndroid,
  Image,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ScrollView as NavigationScrollView } from 'react-native-gesture-handler';

import { Colors, Layout } from '../../constants';

interface State {
  isRefreshing: boolean;
  timeoutId?: any;
}

export default class ReactNativeCoreScreen extends React.Component<{}, State> {
  state: State = {
    isRefreshing: false,
  };

  sections: Array<{ title: string; data: Array<() => JSX.Element> }>;

  constructor(props: any) {
    super(props);

    this.sections = [
      { title: 'Vertical ScrollView, RefreshControl', data: [this._renderVerticalScrollView] },
      { title: 'DrawerLayoutAndroid', data: [this._renderDrawerLayout] },
      { title: 'Horizontal ScrollView', data: [this._renderHorizontalScrollView] },
    ];
  }

  _onRefresh = () => {
    const timeout = setTimeout(() => {
      this.setState({ isRefreshing: false });
    }, 3000);
    this.setState({ isRefreshing: true, timeoutId: timeout });
  };

  componentWillUnmount() {
    clearTimeout(this.state.timeoutId);
  }

  render() {
    const renderNavigationView = () => (
      <View
        style={{
          flex: 1,
          backgroundColor: '#fff',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text>DrawerLayoutAndroid</Text>
      </View>
    );

    return (
      <DrawerLayoutAndroid
        drawerWidth={300}
        // @ts-ignore
        drawerPosition="left"
        renderNavigationView={renderNavigationView}>
        <SectionList
          removeClippedSubviews={false}
          stickySectionHeadersEnabled
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl refreshing={this.state.isRefreshing} onRefresh={this._onRefresh} />
          }
          contentContainerStyle={{ backgroundColor: '#fff' }}
          renderScrollComponent={props => <NavigationScrollView {...props} />}
          renderItem={this._renderItem}
          renderSectionHeader={this._renderSectionHeader}
          sections={this.sections}
          keyExtractor={(_, index) => `${index}`}
        />
      </DrawerLayoutAndroid>
    );
  }

  _renderItem = ({ item }: any) => {
    return <View>{item()}</View>;
  };

  _renderSectionHeader = ({ section: { title } }: any) => {
    return (
      <View style={styles.sectionHeader}>
        <Text>{title}</Text>
      </View>
    );
  };

  _renderVerticalScrollView = () => {
    return (
      <View style={{ padding: 10 }}>
        <Text>
          This screen is a vertical ScrollView, try the pull to refresh gesture to see the
          RefreshControl.
        </Text>
      </View>
    );
  };

  _renderDrawerLayout = () => {
    return (
      <View style={{ padding: 10 }}>
        <Text>Swipe from the left of the screen to see the drawer.</Text>
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
