import * as React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Constants } from 'expo-constants';

class App extends React.Component {
  componentDidMount() {
    // TODO: Bacon: getters aren't working. Constants.name is returning `undefined`
    console.log(Constants.name, Constants);
  }
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.paragraph}>
          Change code in the editor and watch it change on your phone! Save to get a shareable url.
        </Text>
      </View>
    );
  }
}

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: Constants.statusBarHeight,
    backgroundColor: '#ecf0f1',
    padding: 8,
  },
  paragraph: {
    margin: 24,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
