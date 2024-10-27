import { useEffect, useState } from 'react';
import { Button, StyleSheet, TextInput, View } from 'react-native';
import { Screen, ScreenContainer } from 'react-native-screens';

function LazyTabs({
  active,
  renderScreen,
}: {
  active: string;
  renderScreen: (key: string) => JSX.Element;
}) {
  const [screens, setScreens] = useState<string[]>(['azure']);

  useEffect(() => {
    if (!screens.includes(active)) {
      setScreens([...screens, active]);
    }
  }, [screens, active]);

  return (
    <ScreenContainer style={styles.container}>
      {screens.map((key: string) => {
        return (
          <Screen style={StyleSheet.absoluteFill} key={key} activityState={key === active ? 1 : 0}>
            {renderScreen(key)}
          </Screen>
        );
      })}
    </ScreenContainer>
  );
}

export default function App() {
  const [active, setActive] = useState('azure');

  return (
    <View style={styles.container}>
      <LazyTabs
        active={active}
        renderScreen={(color: string) => {
          return (
            <View
              style={{
                flex: 1,
                backgroundColor: color,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <TextInput placeholder="Hello" style={styles.textInput} />
            </View>
          );
        }}
      />
      <View style={styles.tabbar}>
        <Button title="azure" onPress={() => setActive('azure')} />
        <Button title="pink" onPress={() => setActive('pink')} />
        <Button title="cyan" onPress={() => setActive('cyan')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  tabbar: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#eee',
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    padding: 10,
    marginHorizontal: 20,
    alignSelf: 'stretch',
    borderColor: 'black',
  },
});
