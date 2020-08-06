import React from 'react';
import { PixelRatio, StyleSheet, TouchableHighlight } from 'react-native';

import Colors from '../constants/Colors';
import { StyledText } from '../components/Text';
import { StyledView } from '../components/Views';
import { TouchableOpacity } from './Touchables';

type Props = {
  title?: string;
  onPress?: () => void;
};

class ListItem extends React.PureComponent<Props> {
  render() {
    const { title, ...props } = this.props;

    return (
      <TouchableHighlight {...props}>
        <StyledView
          style={styles.container}
          lightBackgroundColor={Colors.light.secondaryBackground}
          lightBorderColor={Colors.light.border}
          darkBackgroundColor={Colors.dark.secondaryBackground}
          darkBorderColor={Colors.dark.border}>
          <StyledText style={styles.title}>{title}</StyledText>
          {this.props.children}
        </StyledView>
      </TouchableHighlight>
    );
  }
}

const pixel = 2 / PixelRatio.get();

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderTopWidth: pixel,
    borderBottomWidth: pixel,
    marginTop: -pixel,
  },
  title: {
    paddingVertical: 10,
    fontSize: 15,
  },
});

export default ListItem;
