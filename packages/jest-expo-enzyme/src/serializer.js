import React from 'react';
import { StyleSheet } from 'react-native';

function createSerializer(styleSheet) {
  function flattenNodeStyles(node) {
    if (node && node.props) {
      // check for React elements in any props
      const nextProps = Object.keys(node.props).reduce((acc, curr) => {
        const value = node.props[curr];
        if (React.isValidElement(value)) {
          acc[curr] = flattenNodeStyles(value);
        }
        return acc;
      }, {});

      // flatten styles and avoid empty objects in snapshots
      if (node.props.style) {
        const style = styleSheet.flatten(node.props.style);
        if (Object.keys(style).length > 0) {
          nextProps.style = style;
        } else {
          delete nextProps.style;
        }
      }

      const args = [node, nextProps];

      // recurse over children too
      const children = node.children || node.props.children;
      if (children) {
        if (Array.isArray(children)) {
          children.forEach(child => {
            args.push(flattenNodeStyles(child));
          });
        } else {
          args.push(flattenNodeStyles(children));
        }
      }

      return React.cloneElement.apply(React.cloneElement, args);
    }

    return node;
  }

  function test(value) {
    return !!value && value.$$typeof === Symbol.for('react.test.json');
  }

  function print(value, serializer) {
    return serializer(flattenNodeStyles(value));
  }

  return { test, print };
}

const serializer = createSerializer(StyleSheet);

export default serializer;
