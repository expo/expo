import React, { PropsWithChildren, ComponentType, forwardRef } from 'react';
import { StyleSheet } from 'react-native';
import View, { ViewProps } from '../primitives/View';
import Text, { TextProps } from '../primitives/Text';
import { em } from '../css/units';

export const UL = forwardRef((props: PropsWithChildren<ViewProps>, ref) => {
  const { children } = props;

  const elements = React.Children.toArray(children).map(element => {
    if (React.isValidElement(element)) return React.cloneElement(element, { bullet: '\u00B7' });
    return element;
  });

  return <View {...props} style={[styles.ul, props.style]} children={elements} ref={ref} />;
}) as ComponentType<ViewProps>;

export const OL = forwardRef((props: PropsWithChildren<ViewProps>, ref) => {
  const { children } = props;

  const elements = React.Children.toArray(children).map((element, index) => {
    if (React.isValidElement(element))
      return React.cloneElement(element, { bullet: `${index + 1}.` });
    return element;
  });

  return <View {...props} style={[styles.ol, props.style]} children={elements} ref={ref} />;
}) as ComponentType<ViewProps>;

function isTextProps(props: any): props is TextProps {
  // Treat <li></li> as a Text element.
  return typeof props.children === 'string';
}

type LIProps = (TextProps | ViewProps) & { bullet?: string };

export const LI = forwardRef((props: PropsWithChildren<LIProps>, ref: any) => {
  const { bullet, children } = props;

  if (isTextProps(props)) {
    return (
      <Text {...props} style={props.style} ref={ref}>
        {bullet} {children}
      </Text>
    );
  }
  return (
    <View {...props} style={[styles.liWrapper, props.style]} ref={ref}>
      <Text>{bullet}</Text>
      {children}
    </View>
  );
}) as ComponentType<LIProps>;

const styles = StyleSheet.create({
  caption: {
    textAlign: 'center',
    fontSize: em(1) as number,
  },
  ul: {
    paddingLeft: 20,
  },
  ol: {
    paddingLeft: 20,
  },
  liWrapper: {
    flexDirection: 'row',
  },
  th: {
    textAlign: 'center',
    fontWeight: 'bold',
    flex: 1,
    fontSize: em(1) as number,
  },
  tr: {
    flexDirection: 'row',
  },
  td: {
    flex: 1,
    fontSize: em(1) as number,
  },
});
