import React from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import { Haptics } from 'expo';

import Button from '../components/Button';
import Colors from '../constants/Colors';
import MonoText from '../components/MonoText';

const sections = [
  {
    method: Haptics.notificationAsync,
    data: [
      {
        accessor: 'Haptics.NotificationFeedbackType.Success',
        value: Haptics.NotificationFeedbackType.Success,
      },
      {
        accessor: 'Haptics.NotificationFeedbackType.Warning',
        value: Haptics.NotificationFeedbackType.Warning,
      },
      {
        accessor: 'Haptics.NotificationFeedbackType.Error',
        value: Haptics.NotificationFeedbackType.Error,
      },
    ],
  },
  {
    method: Haptics.impactAsync,
    data: [
      {
        accessor: 'Haptics.ImpactFeedbackStyle.Light',
        value: Haptics.ImpactFeedbackStyle.Light,
      },
      {
        accessor: 'Haptics.ImpactFeedbackStyle.Medium',
        value: Haptics.ImpactFeedbackStyle.Medium,
      },
      {
        accessor: 'Haptics.ImpactFeedbackStyle.Heavy',
        value: Haptics.ImpactFeedbackStyle.Heavy,
      },
    ],
  },
  {
    method: Haptics.selectionAsync,
    data: [{}],
  },
];

class HapticsScreen extends React.Component {
  static navigationOptions = {
    title: 'Haptics Feedback',
  };

  renderItem = ({ item, section: { method } }) => <Item method={method} type={item} />;

  renderSectionHeader = ({ section: { method } }) => <Header title={method.name} />;

  keyExtractor = ({ accessor, value }) => `key-${accessor}-${value}`;

  render() {
    return (
      <View style={styles.container}>
        <SectionList
          style={styles.list}
          sections={sections}
          renderItem={this.renderItem}
          renderSectionHeader={this.renderSectionHeader}
          keyExtractor={this.keyExtractor}
        />
      </View>
    );
  }
}

class Item extends React.Component {
  get code() {
    const {
      method,
      type: { accessor },
    } = this.props;
    return `Haptics.${method.name}(${accessor || ''})`;
  }
  render() {
    const {
      method,
      type: { value },
    } = this.props;

    return (
      <View style={styles.itemContainer}>
        <HapticButton style={styles.button} method={method} type={value} />
        <MonoText containerStyle={styles.itemText}>{this.code}</MonoText>
      </View>
    );
  }
}

class Header extends React.Component {
  render() {
    const { title } = this.props;
    return (
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>{title}</Text>
      </View>
    );
  }
}

class HapticButton extends React.Component {
  onPress = () => {
    const { method, type } = this.props;
    method(type);
  };
  render() {
    return <Button onPress={this.onPress} style={this.props.style} title="Run" />;
  }
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    flex: 1,
    backgroundColor: Colors.greyBackground,
  },
  list: {
    flex: 1,
    paddingHorizontal: 12,
  },
  headerContainer: {
    alignItems: 'stretch',
    borderBottomColor: Colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: Colors.greyBackground,
  },
  headerText: {
    color: Colors.tintColor,
    paddingVertical: 4,
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemText: {
    borderWidth: 0,
    flex: 1,
    marginVertical: 8,
    paddingVertical: 18,
    paddingLeft: 12,
  },
  button: {
    marginRight: 16,
  },
});

export default HapticsScreen;
