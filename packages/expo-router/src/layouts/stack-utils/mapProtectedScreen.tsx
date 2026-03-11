import React, { Children } from 'react';

import { StackHeaderComponent } from './StackHeaderComponent';
import { StackScreen, appendScreenStackPropsToOptions } from './StackScreen';
import { isChildOfType } from '../../utils/children';
import { Protected, type ProtectedProps } from '../../views/Protected';
import { Screen } from '../../views/Screen';

export function mapProtectedScreen(props: ProtectedProps): ProtectedProps {
  return {
    ...props,
    children: Children.toArray(props.children)
      .map((child, index) => {
        if (isChildOfType(child, StackScreen)) {
          const { children, options: childOptions, ...rest } = child.props;
          const options =
            typeof childOptions === 'function'
              ? (...params: Parameters<typeof childOptions>) =>
                  appendScreenStackPropsToOptions(childOptions(...params), { children })
              : appendScreenStackPropsToOptions(childOptions ?? {}, { children });
          return <Screen key={rest.name} {...rest} options={options} />;
        } else if (isChildOfType(child, Protected)) {
          return <Protected key={`${index}-${props.guard}`} {...mapProtectedScreen(child.props)} />;
        } else if (isChildOfType(child, StackHeaderComponent)) {
          // Ignore Stack.Header, because it can be used to set header options for Stack
          // and we use this function to process children of Stack, as well.
          return null;
        } else {
          if (React.isValidElement(child)) {
            console.warn(`Unknown child element passed to Stack: ${child.type}`);
          } else {
            console.warn(`Unknown child element passed to Stack: ${child}`);
          }
        }
        return null;
      })
      .filter(Boolean),
  };
}
