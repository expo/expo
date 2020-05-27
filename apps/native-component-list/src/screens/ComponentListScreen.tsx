import React from 'react';
import {
  FlatList,
  PixelRatio,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
  StatusBar,
  ListRenderItem,
} from 'react-native';
import { withNavigation, NavigationScreenProps } from 'react-navigation';

import { EvilIcons } from '@expo/vector-icons';

import ExpoAPIIcon from '../components/ExpoAPIIcon';

interface ListElement {
  name: string;
  isAvailable?: boolean;
}

interface Props {
  apis: ListElement[];
}

class ComponentListScreen extends React.Component<NavigationScreenProps & Props> {
  _listView?: FlatList<ListElement>;

  _renderExampleSection: ListRenderItem<ListElement> = ({
    item: { name: exampleName, isAvailable },
  }) => {
    return (
      <TouchableHighlight
        underlayColor="#dddddd"
        style={styles.rowTouchable}
        onPress={isAvailable ? () => this.props.navigation.navigate(exampleName) : undefined}>
        <View style={[styles.row, !isAvailable && styles.disabledRow]}>
          <ExpoAPIIcon name={exampleName} style={styles.rowIcon} />
          <Text style={styles.rowLabel}>{exampleName}</Text>
          <Text style={styles.rowDecorator}>
            <EvilIcons name="chevron-right" size={24} color="#595959" />
          </Text>
        </View>
      </TouchableHighlight>
    );
  };

  _keyExtractor = (item: ListElement) => item.name;

  render() {
    return (
      <View style={{ flex: 1 }}>
        <FlatList<ListElement>
          ref={view => {
            this._listView = view!;
          }}
          initialNumToRender={25}
          stickySectionHeadersEnabled
          removeClippedSubviews={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ backgroundColor: '#fff' }}
          data={this.props.apis}
          keyExtractor={this._keyExtractor}
          renderItem={this._renderExampleSection}
        />
        <StatusBar hidden={false} />
      </View>
    );
  }

  _scrollToTop = () => {
    // @ts-ignore
    this._listView!.scrollTo({ x: 0, y: 0 });
  };
}

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
  disabledRow: {
    opacity: 0.3,
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

export default withNavigation(ComponentListScreen);
