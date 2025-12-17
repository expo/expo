import { requireNativeView } from 'expo';
import * as React from 'react';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export interface TextProps extends CommonViewModifierProps {
  /**
   * Text content or nested Text components.
   */
  children?: React.ReactNode;
}

type NativeTextProps = CommonViewModifierProps & {
  text?: string;
  children?: React.ReactNode;
};

const TextNativeView: React.ComponentType<NativeTextProps> = requireNativeView(
  'ExpoUI',
  'TextView'
);

function transformChildren(children: React.ReactNode): React.ReactNode[] | null {
  const childArray = React.Children.toArray(children);
  if (childArray.length === 0) return null;

  const result: React.ReactNode[] = [];
  let keyIndex = 0;

  for (const child of childArray) {
    if (typeof child === 'string' || typeof child === 'number') {
      result.push(<TextNativeView key={`text-${keyIndex++}`} text={String(child)} />);
    } else if (React.isValidElement(child) && child.type === Text) {
      result.push(child);
    }
  }

  return result.length > 0 ? result : null;
}

export function Text(props: TextProps) {
  const { children, modifiers, ...restProps } = props;

  if (!children) {
    return null;
  }

  const childArray = React.Children.toArray(children);

  const isSimpleText = childArray.every(
    (child) => typeof child === 'string' || typeof child === 'number'
  );

  if (isSimpleText) {
    const combinedText = childArray.map(String).join('');
    return (
      <TextNativeView
        text={combinedText}
        modifiers={modifiers}
        {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
        {...restProps}
      />
    );
  }

  const transformedChildren = transformChildren(children);
  return (
    <TextNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}>
      {transformedChildren}
    </TextNativeView>
  );
}
