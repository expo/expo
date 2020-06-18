import { EvilIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  FlatList,
  ListRenderItem,
  PixelRatio,
  StatusBar,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

interface ListElement {
  name: string;
  route?: string;
  isAvailable?: boolean;
}

interface Props {
  apis: ListElement[];
  renderItemRight?: (props: ListElement) => React.ReactNode;
}

function ComponentListScreen(props: Props) {
  const navigation = useNavigation();
  React.useEffect(() => {
    StatusBar.setHidden(false);
  }, []);

  const _renderExampleSection: ListRenderItem<ListElement> = ({ item }) => {
    const { route, name: exampleName, isAvailable } = item;
    return (
      <TouchableHighlight
        underlayColor="#dddddd"
        style={styles.rowTouchable}
        onPress={isAvailable ? () => navigation.navigate(route ?? exampleName) : undefined}>
        <View style={[styles.row, !isAvailable && styles.disabledRow]}>
          {props.renderItemRight && props.renderItemRight(item)}
          <Text style={styles.rowLabel}>{exampleName}</Text>
          <Text style={styles.rowDecorator}>
            <EvilIcons name="chevron-right" size={24} color="#595959" />
          </Text>
        </View>
      </TouchableHighlight>
    );
  };

  const _keyExtractor = React.useCallback((item: ListElement) => item.name, []);

  return (
    <FlatList<ListElement>
      initialNumToRender={25}
      removeClippedSubviews={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={{ backgroundColor: '#fff' }}
      data={props.apis}
      keyExtractor={_keyExtractor}
      renderItem={_renderExampleSection}
    />
  );
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

export default ComponentListScreen;
