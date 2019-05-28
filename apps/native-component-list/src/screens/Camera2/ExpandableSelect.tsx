import * as React from 'react';
import { TouchableOpacity, View, StyleSheet, Text, ScrollView } from 'react-native';
import { isEqual } from 'lodash';

export interface ExpandableSelectProps<T, Name extends string> {
  value: T;
  onChange: (value: T) => void;
  data: T[];
  icon: React.ReactNode;
  labelExtractor?: (value: T) => string;

  name: Name;
  expandedAction?: string;
  onClick: (name: Name) => void;
}

export default class ExpandableSelect<T, Name extends string> extends React.PureComponent<ExpandableSelectProps<T, Name>> {
  handleOptionChange = (option: T) => {
    const { onChange } = this.props;
    onChange(option);
    this.handleExtending();
  }

  handleExtending = () => {
    this.props.onClick(this.props.name);
  }

  renderItems = () => {
    const { data, value, labelExtractor } = this.props;
    return data.map((option, idx) => (
      <TouchableOpacity
        style={styles.option}
        onPress={() => this.handleOptionChange(option)}
        key={idx}
      >
        <Text style={[styles.optionText, isEqual(value, option) && styles.optionTextSelected]}>
          {labelExtractor ? labelExtractor(option) : option}
        </Text>
      </TouchableOpacity>
    ));
  }

  render() {
    const { icon, expandedAction, name } = this.props;
    const isExpanded = expandedAction === name;
    const isHidden = !!expandedAction && expandedAction !== name;
    return (
      <View style={[styles.container, isExpanded && styles.containerExpanded, isHidden && styles.containerHidden]}>
        <TouchableOpacity style={styles.mainButton} onPress={this.handleExtending}>
          {icon}
        </TouchableOpacity>
        {isExpanded && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          >
            {this.renderItems()}
          </ScrollView>
        )}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  containerExpanded: {
    left: 0,
    right: 0,
  },
  containerHidden: {
    display: 'none',
  },
  mainButton: {
    padding: 10,
  },
  option: {
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontWeight: '400',
    color: 'white',
    textTransform: 'uppercase',
  },
  optionTextSelected: {
    color: 'rgb(220, 190, 40)',
  },
});
