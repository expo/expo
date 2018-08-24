import React from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import { Haptic } from 'expo';
import Button from '../components/Button';
import Colors from '../constants/Colors';
import MonoText from '../components/MonoText';
import CannyFooter from '../components/CannyFooter';

const sections = [
  {
    title: 'notification',
    data: ['success', 'warning', 'error'],
  },
  {
    title: 'impact',
    data: ['light', 'medium', 'heavy'],
  },
  {
    title: 'selection',
    data: [''],
  },
];

class HapticScreen extends React.Component {
  static navigationOptions = {
    title: 'Haptic Feedback',
  };

  renderItem = ({ item, section: { title } }) => <Item method={title} type={item} />;

  renderSectionHeader = ({ section: { title } }) => <Header title={title} />;

  keyExtractor = item => `key-${item}`;

  render() {
    return (
      <View style={styles.container}>
        <SectionList
          style={styles.list}
          sections={sections}
          renderItem={this.renderItem}
          renderSectionHeader={this.renderSectionHeader}
          keyExtractor={this.keyExtractor}
          ListFooterComponent={CannyFooter}
        />
      </View>
    );
  }
}

class Item extends React.Component {
  get code() {
    const { method, type } = this.props;

    let writtenType = '';
    if (type && type !== '') {
      writtenType = `'${type}'`;
    }
    return `Haptic.${method}(${writtenType})`;
  }
  render() {
    const { method, type } = this.props;

    return (
      <View style={styles.itemContainer}>
        <HapticButton style={styles.button} method={method} type={type} />
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
        <Text style={styles.headerText}>{title.toUpperCase()}</Text>
      </View>
    );
  }
}

class HapticButton extends React.Component {
  onPress = () => {
    const { method, type } = this.props;
    Haptic[method](type);
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

export default HapticScreen;
