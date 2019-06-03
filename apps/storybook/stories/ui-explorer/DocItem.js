import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AppText from './AppText';
import insertBetween from './insertBetween';
import rem from './rem';

const Divider = () => <View style={styles.verticalDivider} />;

const createDescription = description => {
  const nodeList = React.Children.toArray(description);
  let content;
  if (nodeList.length === 1) {
    content = <Text>{nodeList}</Text>;
  } else {
    content = insertBetween(() => <Divider key={Math.random()} />, nodeList);
  }
  return <Text style={styles.text}>{content}</Text>;
};

const DocItem = ({ description, example = {}, name, typeInfo, label }) => (
  <View style={styles.example}>
    {name && (
      <AppText style={styles.title}>
        <PropText label={label} name={name} typeInfo={typeInfo} />
      </AppText>
    )}
    {description && <View style={styles.description}>{createDescription(description)}</View>}
    {(example.render || example.code) && (
      <View style={styles.renderBox}>
        <AppText style={styles.exampleText}>Example</AppText>
        {example.render && <View>{example.render()}</View>}
        {example.render && example.code && <View style={styles.verticalDivider} />}
        {example.code && <Text style={styles.code}>{example.code}</Text>}
      </View>
    )}
  </View>
);

const PropText = ({ label, name, typeInfo }) => (
  <AppText>
    {label && <Text style={[styles.label, label === 'web' && styles.webLabel]}>{label}</Text>}
    <Text style={styles.propName}>{name}</Text>
    {typeInfo && (
      <Text>
        {': '}
        <Text style={styles.code}>{typeInfo}</Text>
      </Text>
    )}
  </AppText>
);

const styles = StyleSheet.create({
  code: {
    fontFamily: 'monospace, monospace',
    fontSize: rem(1),
    lineHeight: rem(1.3125),
  },
  example: {
    marginBottom: rem(1.5 * 1.3125),
  },
  title: {
    fontSize: rem(1),
  },
  text: {
    alignItems: 'stretch',
    display: 'flex',
    flexDirection: 'column',
    fontSize: rem(1),
    lineHeight: rem(1.3125),
  },
  label: {
    backgroundColor: '#ddd',
    borderRadius: rem(1),
    color: '#555',
    marginRight: rem(0.5),
    paddingVertical: rem(0.125),
    paddingHorizontal: rem(0.5),
  },
  propName: {
    fontWeight: 'bold',
  },
  webLabel: {
    backgroundColor: '#bdebff',
    color: '#025268',
  },
  description: {
    marginTop: rem(0.5 * 1.3125),
  },
  renderBox: {
    borderColor: '#E6ECF0',
    borderWidth: 1,
    padding: rem(1.3125),
    marginTop: rem(1.3125),
  },
  exampleText: {
    color: '#AAB8C2',
    fontSize: rem(0.8),
    fontWeight: 'bold',
    marginBottom: rem(0.5 * 1.3125),
    textTransform: 'uppercase',
  },
  verticalDivider: {
    height: rem(1),
  },
});

export default DocItem;
