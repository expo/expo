import Ionicons from '@expo/vector-icons/Ionicons';
import { StackNavigationProp } from '@react-navigation/stack';
import { FlatList, PixelRatio, StyleSheet, Text, TouchableHighlight, View } from 'react-native';

import examples from './examples';

type StackParams = {
  SVGExample: { title: string; key: string };
};

export default function SVGScreen({
  navigation,
}: {
  navigation: StackNavigationProp<StackParams>;
}) {
  return (
    <FlatList<string>
      style={styles.container}
      data={Object.keys(examples)}
      renderItem={({ item: exampleKey }) => (
        <TouchableHighlight
          underlayColor="#dddddd"
          style={styles.rowTouchable}
          onPress={() => navigation.navigate('SVGExample', { title: exampleKey, key: exampleKey })}>
          <View style={styles.row}>
            <View style={styles.rowIcon}>{examples[exampleKey].icon}</View>
            <Text style={styles.rowLabel}>{exampleKey}</Text>
            <Text style={styles.rowDecorator}>
              <Ionicons name="chevron-forward" size={18} color="#595959" />
            </Text>
          </View>
        </TouchableHighlight>
      )}
      keyExtractor={(item: string) => item}
    />
  );
}
SVGScreen.navigationOptions = {
  title: '<Svg />',
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'white',
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
