// Shim for supporting React 19 meta tags on native.
import * as ReactNativeViewConfigRegistry from 'react-native/Libraries/Renderer/shims/ReactNativeViewConfigRegistry';

for (const key of ['title', 'link', 'meta', 'style', 'script']) {
  ReactNativeViewConfigRegistry.register(key, () => {
    const config = ReactNativeViewConfigRegistry.get('RCTVirtualText');
    return {
      ...config,
      // Modify to make nothing render
      validAttributes: {
        ...config.validAttributes,
        // Add any custom attributes you want to support
        // For example, if you want to support a custom attribute called "title"
        children: {
          process: () => {
            return null;
          },
        },
      },
    };
  });
}

for (const key of [
  'div',
  'span',
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'a',
  'ul',
  'ol',
  'li',
  'strong',
  'em',
  'b',
  'i',
  'br',
  'hr',
  'img',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'caption',
  'form',
  'input',
  'button',
  'select',
  'option',
  'textarea',
  'label',
  'fieldset',
  'legend',
  'details',
  'summary',
  'dialog',
]) {
  ReactNativeViewConfigRegistry.register(key, () => {
    throw new Error(
      `DOM element <${key} /> is not supported on native. Solutions include switching to a universal component like <View>, <Text>, or <ScrollView>. Alternatively, render web code in an Expo DOM component with the "use dom" directive.`
    );
  });
}
