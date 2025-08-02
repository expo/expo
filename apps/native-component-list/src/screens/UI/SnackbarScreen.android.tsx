import { Snackbar, Button, SnackbarDuration, Picker } from '@expo/ui/jetpack-compose';
import { Container } from '@expo/ui/jetpack-compose-primitives';
import * as React from 'react';
import { Switch, Text as RNText, View, StyleSheet, Alert } from 'react-native';

const customColors = {
  containerColor: '#15a325',
  contentColor: '#FFFFFF',
  actionColor: '#ffffff',
  actionContentColor: '#000000',
  dismissActionContentColor: '#FFFFFF',
};

export default function SnackbarScreen() {
  const [visible, setVisible] = React.useState(false);
  const [withActionLabel, setWithActionLabel] = React.useState(false);
  const [duration, setDuration] = React.useState(SnackbarDuration.Short);
  const [withDismissAction, setWithDismissAction] = React.useState(false);
  const [withCustomColors, setWithCustomColors] = React.useState(false);

  return (
    <>
      <View style={styles.container}>
        <View style={styles.row}>
          <RNText>With Action Label</RNText>
          <Switch value={withActionLabel} onValueChange={setWithActionLabel} />
        </View>

        <View style={styles.row}>
          <RNText>With Dismiss Action</RNText>
          <Switch value={withDismissAction} onValueChange={setWithDismissAction} />
        </View>

        <View style={styles.row}>
          <RNText>Use Custom Colors</RNText>
          <Switch value={withCustomColors} onValueChange={setWithCustomColors} />
        </View>

        <View style={styles.row}>
          <RNText>Duration</RNText>
          <Picker
            options={Object.values(SnackbarDuration)}
            selectedIndex={Object.values(SnackbarDuration).indexOf(duration)}
            onOptionSelected={({ nativeEvent: { index } }) => {
              setDuration(Object.values(SnackbarDuration)[index]);
            }}
          />
        </View>

        <Button onPress={() => setVisible(true)} variant="outlined">
          Show Snackbar
        </Button>
      </View>

      <Container style={styles.snackbarContainer}>
        <Snackbar
          visible={visible}
          message={`This is a ${duration} snackbar message`}
          actionLabel={withActionLabel ? 'UNDO' : undefined}
          duration={duration}
          withDismissAction={withDismissAction}
          colors={withCustomColors ? customColors : undefined}
          onDismissed={() => setVisible(false)}
          onActionPressed={() => Alert.alert('Action pressed')}
        />
      </Container>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  snackbarContainer: {
    flex: 1,
  },
});
