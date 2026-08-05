import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { FlatList, PixelRatio, StyleSheet, TouchableHighlight, View } from 'react-native';

import { BodyText } from '../../components/BodyText';
import { optionalRequire } from '../../navigation/routeBuilder';
import examples from './examples';

export const SVGScreens = [
  {
    name: 'SVGExample',
    route: 'svg/example',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./SVGExampleScreen'));
    },
  },
];

export default function SVGScreen() {
  return (
    <FlatList<string>
      style={styles.container}
      data={Object.keys(examples)}
      renderItem={({ item: exampleKey }) => (
        <TouchableHighlight
          underlayColor="#dddddd"
          style={styles.rowTouchable}
          onPress={() =>
            router.push({ pathname: '/components/svg/example', params: { exampleKey } })
          }>
          <View style={styles.row}>
            <View style={styles.rowIcon}>{examples[exampleKey].icon}</View>
            <BodyText style={styles.rowLabel}>{exampleKey}</BodyText>
            <BodyText style={styles.rowDecorator}>
              <Ionicons name="chevron-forward" size={18} color="#595959" />
            </BodyText>
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
    ...StyleSheet.absoluteFill,
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
