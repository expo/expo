import React from 'react';
import { Platform, StyleSheet, Text } from 'react-native';

function useChildren(inputChildren: React.ReactNode) {
  return React.useMemo(() => {
    const children: React.ReactNode[] = [];
    React.Children.forEach(inputChildren, (child) => {
      if (child == null || typeof child === 'boolean') {
      } else if (
        typeof child === 'string' ||
        typeof child === 'number' ||
        typeof child === 'bigint'
      ) {
        // Wrap text in a Text component.
        let message = `Invalid raw text as a child of View: "${child}"${
          child === '' ? ` [empty string]` : ''
        }.`;
        message += ' Wrap the text contents with a Text element or remove it.';
        console.warn(message);
        children.push(
          <Text style={[StyleSheet.absoluteFill, styles.error]}>
            Unwrapped text: "<Text style={{ fontWeight: 'bold' }}>{child}</Text>"
          </Text>
        );
      } else if ('type' in child && typeof child?.type === 'string' && Platform.OS !== 'web') {
        // Disallow untransformed react-dom elements on native.
        throw new Error(`Using unsupported React DOM element: <${child.type} />`);
      } else {
        children.push(child);
      }
    });
    return children;
  }, [inputChildren]);
}

/** Extend a view with a `children` filter that asserts more helpful warnings/errors. */
export function createDevView<TView extends React.ComponentType<any>>(View: TView) {
  return React.forwardRef(({ children, ...props }: any, forwardedRef: React.Ref<TView>) => {
    return <View ref={forwardedRef} {...props} children={useChildren(children)} />;
  });
}

const styles = StyleSheet.create({
  error: {
    backgroundColor: 'firebrick',
    color: 'white',
  },
});
