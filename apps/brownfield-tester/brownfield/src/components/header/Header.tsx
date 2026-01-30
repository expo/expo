import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import type { HeaderProps } from './types';

const Header = ({ title }: HeaderProps) => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [styles.backButton, pressed && styles.focused]}
        onPress={() => router.back()}>
        <Feather name="arrow-left" size={24} color="black" />
      </Pressable>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: 'lightgray',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  focused: {
    opacity: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  backButton: {
    position: 'absolute',
    paddingLeft: 16,
    left: 0,
  },
});
