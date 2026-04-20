import { StyleSheet, Text, View } from 'react-native';

export const Loading = () => {
  return (
    <View style={styles.container}>
      <Text testID="suspense-fallback" style={styles.text}>Loading...</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#202425',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#313538',
  },
  text: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
});