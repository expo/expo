import * as DevMenu from 'expo-dev-menu';
import { StatusBar, setStatusBarHidden } from 'expo-status-bar';
import { StyleSheet, Button, Text, View, TouchableOpacity } from 'react-native';
import * as SystemNavigationBar from 'expo-system-navigation-bar';
import React from 'react';

// function useVisibility() {
//   const [value, setValue] = React.useState(null);

//   React.useEffect(() => {
//     const sub = SystemNavigationBar.addVisibilityListener(ev => {
//       console.log('changed:', ev);

//     })

//     return () => sub.remove();
//   }, []);
// }

export function usePosition(): [SystemNavigationBar.Position, (position: SystemNavigationBar.Position) => void] {
  const [position, setPosition] = React.useState<SystemNavigationBar.Position | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    SystemNavigationBar.getPositionAsync().then((position) => {
      if (isMounted) {
        setPosition(position);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const setNewPosition = React.useCallback((position: SystemNavigationBar.Position) => {
    SystemNavigationBar.setPositionAsync(position);
    setPosition(position);
  }, [setPosition])

  return [position, setNewPosition];
}


export default function App() {
  const [status, setStatus] = React.useState(true);
  const visibility = SystemNavigationBar.useVisibility();
  const [position, setPosition] = usePosition();

  React.useEffect(() => {
    const sub = SystemNavigationBar.addVisibilityListener((ev) => {
      const isStatusBarVisible = (ev.state & 4) === 0;
      const isNavigationBarVisible = (ev.state & 2) === 0;
      console.log('changed:', ev, { isStatusBarVisible, isNavigationBarVisible });
    });

    return () => sub.remove();
  }, []);

  const nextVisibility = visibility === 'visible' ? 'hidden' : 'visible'
  const nextPosition = position === 'absolute' ? 'relative' : 'absolute'

  return (
    <View style={{ flex: 1, backgroundColor: 'white', alignItems: 'stretch' }}>
      <View style={styles.container}>
        <Text>Open up App.js to start working on your app!</Text>
        <Text>Visibility: {visibility}</Text>
        <Text>Position: {position}</Text>
        <Button
          title={`Toggle Bar: ${nextVisibility}`}
          onPress={() => {
            SystemNavigationBar.setVisibilityAsync(nextVisibility);
          }}
        />
        <Button
          title={`Toggle Position: ${nextPosition}`}
          onPress={() => {
            setPosition(nextPosition)
            SystemNavigationBar.getPositionAsync().then(console.log)
          }}
        />
        <Button
          title="Toggle Status Bar"
          onPress={() => {
            setStatus((v) => !v);
            setStatusBarHidden(status, 'fade')
          }}
        />
        <SetNavigationBarVisibilityExample />
        <SetNavigationBarColorExample />
        <SetNavigationBarDividerColorExample />
        <EdgeToEdgeModeExample />
        <StatusBar style="auto" />
      </View>
      <View>
        <Text style={{ fontSize: 16, margin: 4 }}>Bottom of screen</Text>
        <View style={{ padding: 24, borderColor: 'red', borderWidth: 1, margin: 4 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    backgroundColor: '#4630eb',
    borderRadius: 4,
    padding: 12,
    marginVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
  },
});


function SetNavigationBarVisibilityExample() {

  const [navigationBarVisibility, setNavigationBarVisibility] = React.useState<
    'visible' | 'hidden'
  >('visible');

  const toggleNavigationBar = React.useCallback(() => {
    setNavigationBarVisibility((currentValue) => {
      const newValue = currentValue === 'visible' ? 'hidden' : 'visible';
      SystemNavigationBar.setVisibilityAsync(newValue);
      return newValue;
    });
  }, []);

  return (
    <>
      <Button
        onPress={toggleNavigationBar}
        title={navigationBarVisibility === 'hidden' ? 'Show Navigation Bar' : 'Hide Navigation Bar'}
      />

    </>
  );
}

function getRandomColor(): string {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function SetNavigationBarColorExample() {
  const [style, setStyle] = React.useState<'light' | 'dark'>('light');
  const nextStyle = style === 'light' ? 'dark' : 'light';
  return (
    <>
      <Button
        onPress={() => {
          SystemNavigationBar.setBackgroundColorAsync(getRandomColor());
        }}
        title="Set Navigation Bar to random color"
      />
      <Button
        onPress={() => {
          SystemNavigationBar.setAppearanceAsync(nextStyle);
          setStyle(nextStyle);
        }}
        title={`Set Navigation Bar Style to ${nextStyle}`}
      />
    </>
  );
}

function SetNavigationBarDividerColorExample() {
  return (
    <>
      <Button
        onPress={() => {
          SystemNavigationBar.setBorderColorAsync(getRandomColor());
        }}
        title="Set Navigation Bar Divider to random color"
      />
    </>
  );
}


const SystemNavigationBarBehaviors: SystemNavigationBar.SystemUIBehavior[] = [
  'inset-swipe',
  'inset-touch',
  'overlay-swipe',
];

function EdgeToEdgeModeExample() {
  const [isEdgeToEdge, setIsEdgeToEdge] = React.useState(false);
  const [SystemNavigationBarBehavior, setSystemNavigationBarBehavior] =
    React.useState<SystemNavigationBar.SystemUIBehavior>('inset-swipe');

  const onPress = React.useCallback(() => {
    setIsEdgeToEdge((is) => {
      const newValue = !is;
      SystemNavigationBar.setBackgroundColorAsync(newValue ? '#ff000000' : '#ff0000ff');

      SystemNavigationBar.setPositionAsync(newValue ? 'absolute' : 'relative');
      return newValue;
    });
  }, []);

  const nextSystemNavigationBarBehavior = React.useMemo(() => {
    const index = SystemNavigationBarBehaviors.indexOf(SystemNavigationBarBehavior);
    const newIndex = (index + 1) % SystemNavigationBarBehaviors.length;
    return SystemNavigationBarBehaviors[newIndex];
  }, [SystemNavigationBarBehavior]);

  const onPressBehavior = React.useCallback(() => {
    SystemNavigationBar.setBehaviorAsync(nextSystemNavigationBarBehavior);
    setSystemNavigationBarBehavior(nextSystemNavigationBarBehavior);
  }, [nextSystemNavigationBarBehavior]);

  return (
    <>
      <Button
        onPress={onPress}
        title={`${isEdgeToEdge ? 'Disable' : 'Enable'} Edge-to-Edge Mode`}
      />
      <Button
        onPress={onPressBehavior}
        title={`Set System UI behavior to ${nextSystemNavigationBarBehavior}`}
      />
    </>
  );
}
