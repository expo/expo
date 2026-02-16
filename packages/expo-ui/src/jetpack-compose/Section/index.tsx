import { requireNativeView } from 'expo';
import React from 'react';
import { NativeSyntheticEvent } from 'react-native';

import { ExpoModifier } from '../../types';

export type SectionProps = {
  /**
   * The children of the `Section` component.
   */
  children: React.ReactNode;
  /**
   * Title displayed in the section header.
   */
  title?: string;
  /**
   * Whether the section content is expanded (visible).
   * @default true
   */
  isExpanded?: boolean;
  /**
   * Callback fired when the expand/collapse state changes.
   */
  onIsExpandedChange?: (isExpanded: boolean) => void;
  /**
   * Background color of the section card.
   */
  containerColor?: string;
  /**
   * Color of the title text.
   */
  titleColor?: string;
  /**
   * Modifiers for the component.
   */
  modifiers?: ExpoModifier[];
};

type NativeSectionProps = Omit<SectionProps, 'onIsExpandedChange'> & {
  onIsExpandedChange?: (event: NativeSyntheticEvent<{ isExpanded: boolean }>) => void;
};

const SectionNativeView: React.ComponentType<NativeSectionProps> = requireNativeView(
  'ExpoUI',
  'SectionView'
);

export function Section(props: SectionProps) {
  const nativeProps: NativeSectionProps = {
    ...props,
    onIsExpandedChange: props.onIsExpandedChange
      ? ({ nativeEvent: { isExpanded } }) => {
          props.onIsExpandedChange!(isExpanded);
        }
      : undefined,
  };

  return <SectionNativeView {...nativeProps} />;
}
