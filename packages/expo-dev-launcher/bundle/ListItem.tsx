import React from 'react';
import { PixelRatio, StyleSheet, TouchableOpacity, View, Text } from 'react-native';

type Props = {
  title?: string;
  onPress?: () => void;
  disabled?: boolean;
};

class ListItem extends React.PureComponent<Props> {
  render() {
    const { title, ...props } = this.props;

    return (
      <TouchableOpacity {...props}>
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>
          {this.props.children}
        </View>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 20,
    backgroundColor: '#f5f5f5',
    marginBottom: 2,
    marginTop: 2,
  },
  title: {
    paddingVertical: 10,
    fontSize: 15,
  },
});

export default ListItem;
