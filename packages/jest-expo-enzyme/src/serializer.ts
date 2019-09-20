import { cloneElement, isValidElement } from 'react';
import { StyleSheet } from 'react-native';

function create(StyleSheet: { flatten: (style: any) => any }): any {
  function flattenNodeStyles(node?: any): any {
    if (node && node.props) {
      // check for React elements in any props
      const nextProps: { [key: string]: any } = Object.keys(node.props).reduce(
        (acc, curr) => {
          const value = node.props[curr];
          if (isValidElement(value)) {
            acc[curr] = flattenNodeStyles(value);
          }
          return acc;
        },
        {} as { [key: string]: any }
      );

      // flatten styles and avoid empty objects in snapshots
      if (node.props.style) {
        const style = StyleSheet.flatten(node.props.style);
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

      return cloneElement.apply(cloneElement, args as any);
    }

    return node;
  }

  return {
    test(value: any): boolean {
      return !!value && value.$$typeof === Symbol.for('react.test.json');
    },
    print(value: any, serialize: (val: any) => string): string {
      return serialize(flattenNodeStyles(value));
    },
  };
}

export default create(StyleSheet);
