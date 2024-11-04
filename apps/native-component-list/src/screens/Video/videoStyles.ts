import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 50,
  },
  controlsContainer: {
    alignSelf: 'stretch',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  picker: {
    alignSelf: 'stretch',
    backgroundColor: '#e0e0e0',
  },
  switch: {
    flex: 1,
    flexDirection: 'column',
  },
  switchTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    opacity: 0.5,
    fontSize: 12,
    marginBottom: 2,
  },
  video: {
    width: 300,
    height: 225,
  },
  button: {
    margin: 5,
  },
  mediumText: {
    fontSize: 16,
  },
  centerText: {
    textAlign: 'center',
  },
});
