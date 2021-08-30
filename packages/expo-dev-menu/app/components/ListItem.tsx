import React from 'react';
import { PixelRatio, StyleSheet } from 'react-native';

import { StyledText } from '../components/Text';
import { StyledView } from '../components/Views';
import Colors from '../constants/Colors';
import { TouchableHighlight } from './Touchables';

type Props = {
  content?: string | React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
};

class ListItem extends React.PureComponent<Props> {
  render() {
    const { content: title, ...props } = this.props;
    const textColor = props.disabled
      ? {
          lightColor: Colors.light.disabledTest,
          darkColor: Colors.dark.disabledTest,
        }
      : {};

    let titleComponent;
    if (typeof title === 'string') {
      titleComponent = (
        <StyledText
          lightColor={Colors.light.menuItemText}
          darkColor={Colors.dark.menuItemText}
          style={styles.title}
          {...textColor}>
          {title}
        </StyledText>
      );
    } else {
      titleComponent = title;
    }

    return (
      <TouchableHighlight {...props}>
        <StyledView
          style={styles.container}
          lightBackgroundColor={Colors.light.secondaryBackground}
          lightBorderColor={Colors.light.border}
          darkBackgroundColor={Colors.dark.secondaryBackground}
          darkBorderColor={Colors.dark.border}>
          {titleComponent}
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
