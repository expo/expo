import { useState, useCallback } from 'react';
import { type ViewProps } from 'react-native';

import { type DOMProps, type WebViewProps } from '../dom.types';

/**
 * Debug only hook to help identify zero height issues in the DOM component.
 */
export function useDebugZeroHeight(dom: DOMProps) {
  const [debugZeroHeightStyle, setDebugZeroHeightStyle] = useState<
    WebViewProps['containerStyle'] | undefined
  >(undefined);
  const [hasLoggedWarning, setHasLoggedWarning] = useState(false);

  const debugOnLayout = useCallback<NonNullable<ViewProps['onLayout']>>(
    (event) => {
      dom.onLayout?.(event);
      // Adding __DEV__ for tree shaking in production build.
      if (__DEV__) {
        if (dom.matchContents) {
          return;
        }
        if (debugZeroHeightStyle !== undefined) {
          return;
        }
        if (event.nativeEvent.layout.height === 0) {
          if (!hasLoggedWarning) {
            console.warn(`
The DOM component has a zero height in native hierarchy.
We are adding a debug style to help you identify the issue.
You can remove this style by using the \`matchContents\` prop or explicitly add a height from the component callsite.
\`\`\`
<YourDomComponent dom={{ matchContents: true }} />
// or
<YourDomComponent dom={{ style: { height: 50 } }} />
\`\`\`
`);
            setHasLoggedWarning(true);
          }
          setDebugZeroHeightStyle({
            borderWidth: 1,
            borderColor: 'red',
            borderRadius: 2,
            minHeight: 40,
          });
        } else {
          setDebugZeroHeightStyle({});
        }
      }
    },
    [dom.matchContents, dom.onLayout, debugZeroHeightStyle, hasLoggedWarning]
  );

  return { debugZeroHeightStyle, debugOnLayout };
}
