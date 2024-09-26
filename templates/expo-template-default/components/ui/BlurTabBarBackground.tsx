import { BlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';

import { useColorScheme } from '@/hooks/useColorScheme';

export default function BlurTabBarBackground() {
  const colorScheme = useColorScheme();
  return <BlurView tint={colorScheme ?? 'light'} intensity={100} style={StyleSheet.absoluteFill} />;
}
