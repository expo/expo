import React from 'react';
import { PixelRatio, StyleSheet } from 'react-native';

import { StyledText } from '../components/Text';
import { StyledView } from '../components/Views';
import Colors from '../constants/Colors';
import { TouchableHighlight } from './Touchables';

type Props = {
  title?: string;
  onPress?: () => void;
  disabled?: boolean;
};

class ListItem extends React.PureComponent<Props> {
  render() {
    const { title, ...props } = this.props;
    const textColor = props.disabled
      ? {
          lightColor: Colors.light.grayText,
          darkColor: Colors.dark.grayText,
        }
      : {};

    return (
      <TouchableHighlight {...props}>
        <StyledView
          style={styles.container}
          lightBackgroundColor={Colors.light.secondaryBackground}
          lightBorderColor={Colors.light.border}
          darkBackgroundColor={Colors.dark.secondaryBackground}
          darkBorderColor={Colors.dark.border}>
          <StyledText style={styles.title} {...textColor}>
            {title}
          </StyledText>
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
