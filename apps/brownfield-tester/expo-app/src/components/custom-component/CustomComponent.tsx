import { StyleSheet, Text, View } from 'react-native';

const CustomComponent = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Custom React Native Component</Text>
    </View>
  );
};

export default CustomComponent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#60a5fa',
    borderRadius: 20,
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
  },
});
