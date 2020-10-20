import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = React.ComponentProps<typeof View> & {
  text: string;
};

function Badge(props: Props) {
  const { text, ...rest } = props;
  return (
    <View {...rest} style={[styles.container, rest.style]}>
      <Text style={styles.text} numberOfLines={1} ellipsizeMode="tail">
        {text}
      </Text>
    </View>
  );
}

export default Badge;

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,0.025)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#888',
    fontSize: 11,
  },
});
