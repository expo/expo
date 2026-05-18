import { PropsWithChildren } from 'react';
import { StyleSheet, Text, TextProps, View } from 'react-native';
import { type ThemeType, useTheme } from 'ThemeProvider';

type Props = PropsWithChildren<TextProps> & {
  color?: keyof ThemeType['text'];
};

const HeadingText = ({ children, color = 'default', style }: Props) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.headingText, { color: theme.text[color] }, style]}>{children}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  headingText: {
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default HeadingText;
