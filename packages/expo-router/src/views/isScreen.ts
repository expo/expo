import { isValidElement, type ReactElement, type ReactNode } from 'react';

import { Screen, type ScreenProps } from './Screen';
import { StackScreen } from '../layouts/StackElements';

export function isScreen(
  child: ReactNode,
  contextKey?: string
): child is ReactElement<ScreenProps & { name: string }> {
  if (isValidElement(child) && child && (child.type === Screen || child.type === StackScreen)) {
    if (
      typeof child.props === 'object' &&
      child.props &&
      'name' in child.props &&
      !child.props.name
    ) {
      throw new Error(
        `<Screen /> component in \`default export\` at \`app${contextKey}/_layout\` must have a \`name\` prop when used as a child of a Layout Route.`
      );
    }

    if (process.env.NODE_ENV !== 'production') {
      if (
        ['component', 'getComponent'].some(
          (key) => child.props && typeof child.props === 'object' && key in child.props
        )
      ) {
        throw new Error(
          `<Screen /> component in \`default export\` at \`app${contextKey}/_layout\` must not have a \`component\`, or \`getComponent\` prop when used as a child of a Layout Route`
        );
      }
    }

    return true;
  }

  return false;
}
