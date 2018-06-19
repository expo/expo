import React from 'react';
import {
  Alert,
  ListView,
  PixelRatio,
  Platform,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

// import { Entypo } from '@expo/vector-icons';
import ExpoAPIIcon from '../components/ExpoAPIIcon';
// import NavigationEvents from '../utilities/NavigationEvents';
import { withNavigation } from 'react-navigation';

// @withNavigation
class ComponentListScreen extends React.Component {
  state = {
    dataSource: new ListView.DataSource({
      rowHasChanged: () => false,
      sectionHeaderHasChanged: () => false,
    }),
  };

  componentWillMount() {
    const { tabName } = this.props;
    // this._tabPressedListener = NavigationEvents.addListener('selectedTabPressed', route => {
    //   if (tabName && route.key === tabName) {
    //     this._scrollToTop();
    //   }
    // });
  }

  componentWillUnmount() {
    this._tabPressedListener.remove();
  }

  componentDidMount() {
    let dataSource = this.state.dataSource.cloneWithRowsAndSections(
      this.props.apis.reduce((sections, name) => {
        sections[name] = [() => this._renderExampleSection(name)];
        return sections;
      }, {})
    );

    this.setState({ dataSource });
  }

  _renderExampleSection = exampleName => {
    return (
      <TouchableHighlight
        underlayColor="#dddddd"
        style={styles.rowTouchable}
        onPress={() => this.props.navigation.navigate(exampleName)}>
        <View style={styles.row}>
          <ExpoAPIIcon name={exampleName} style={styles.rowIcon} />
          <Text style={styles.rowLabel}>{exampleName}</Text>
          <Text style={styles.rowDecorator}>
          </Text>
        </View>
      </TouchableHighlight>
    );
  };

  render() {
    return (
      <ListView
        ref={view => {
          this._listView = view;
        }}
        stickySectionHeadersEnabled
        removeClippedSubviews={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ backgroundColor: '#fff' }}
        dataSource={this.state.dataSource}
        renderRow={this._renderRow}
      />
    );
  }

  _scrollToTop = () => {
    this._listView.scrollTo({ x: 0, y: 0 });
  };

  _renderRow = renderRowFn => {
    return <View>{renderRowFn && renderRowFn()}</View>;
  };
}

export default withNavigation(ComponentListScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 100,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowDecorator: {
    alignSelf: 'flex-end',
    paddingRight: 4,
  },
  rowTouchable: {
    paddingHorizontal: 10,
    paddingVertical: 14,
    borderBottomWidth: 1.0 / PixelRatio.get(),
    borderBottomColor: '#dddddd',
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
  },
  rowIcon: {
    marginRight: 10,
    marginLeft: 6,
  },
});
