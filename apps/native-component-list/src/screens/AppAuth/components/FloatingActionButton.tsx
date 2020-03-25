import { ActionSheetProvider, connectActionSheet } from '@expo/react-native-action-sheet';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import Services from '../constants/Services';
import ServiceContext from '../context/ServiceContext';

const size = 64;
function FloatingActionButton({ showActionSheetWithOptions }: any) {
  const { setService } = React.useContext(ServiceContext);

  return (
    <TouchableOpacity
      style={{
        position: 'absolute',
        bottom: 16,
        right: 16,
      }}
      onPress={() => {
        const options = [...Object.keys(Services), 'Cancel'];
        const cancelButtonIndex = options.length - 1;
        showActionSheetWithOptions({ options, cancelButtonIndex }, (index: number) => {
          if (index < cancelButtonIndex) {
            setService(options[index]);
          }
        });
      }}>
      <View style={styles.button}>
        <MaterialIcons size={size * 0.5} color="black" name="https" />
      </View>
    </TouchableOpacity>
  );
}

const FloatingActionButtonActionSheet = connectActionSheet(FloatingActionButton);

export default function FloatingActionScreen({ children }: any) {
  return (
    <ActionSheetProvider>
      <View style={{ flex: 1 }}>
        {children}
        <FloatingActionButtonActionSheet />
      </View>
    </ActionSheetProvider>
  );
}

const styles = StyleSheet.create({
  button: {
    width: size,
    height: size,
    borderRadius: size / 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  text: {
    marginVertical: 15,
    marginHorizontal: 10,
  },
  faintText: {
    color: '#888',
    marginHorizontal: 30,
  },
  oopsTitle: {
    fontSize: 25,
    marginBottom: 5,
    textAlign: 'center',
  },
  oopsText: {
    textAlign: 'center',
    marginTop: 10,
    marginHorizontal: 30,
  },
});
