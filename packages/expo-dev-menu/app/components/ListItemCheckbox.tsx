import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicon } from '../components/Icon';

import ListItem from './ListItem';

type Props = {
  title: string;
  initialChecked?: boolean;
  onChange?: (checked: boolean) => void;
};

type State = {
  checked: boolean;
};

class ListItemCheckbox extends React.PureComponent<Props, State> {
  constructor(props) {
    super(props);

    this.state = {
      checked: !!props.initialChecked,
    };
  }

  private renderCheck() {
    const { checked } = this.state;

    if (!checked) {
      return null;
    }
    return (
      <View style={styles.checkContainer}>
        <Ionicon name="ios-checkmark" size={30} color="tint" />
      </View>
    );
  }

  private onPress = () => {
    const checked = !this.state.checked;

    this.setState({ checked });
    this.props.onChange?.(checked);
  };

  render() {
    return (
      <ListItem {...this.props} onPress={this.onPress}>
        {this.renderCheck()}
      </ListItem>
    );
  }
}

const styles = StyleSheet.create({
  checkContainer: {},
});

export default ListItemCheckbox;
