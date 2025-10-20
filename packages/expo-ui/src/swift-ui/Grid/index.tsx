import { requireNativeView } from 'expo';
import React from 'react';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export type GridProps = {
  /**
   * The guide for aligning the child views within the space allocated for a given cell. The default is center.
   */
  alignment?:
    | 'center'
    | 'leading'
    | 'trailing'
    | 'top'
    | 'bottom'
    | 'topLeading'
    | 'topTrailing'
    | 'bottomLeading'
    | 'bottomTrailing'
    | 'centerFirstTextBaseline'
    | 'centerLastTextBaseline'
    | 'leadingFirstTextBaseline'
    | 'leadingLastTextBaseline'
    | 'trailingFirstTextBaseline'
    | 'trailingLastTextBaseline';
  /**
   * The vertical distance between each cell, given in points. The value is nil by default, which results in a default distance between cells that’s appropriate for the platform.
   */
  verticalSpacing?: number;
  /**
   * The horizontal distance between each cell, given in points. The value is nil by default, which results in a default distance between cells that’s appropriate for the platform.
   */
  horizontalSpacing?: number;
  children: React.ReactNode;
} & CommonViewModifierProps;

const GridNativeView: React.ComponentType<GridProps> = requireNativeView('ExpoUI', 'GridView');

const GridRowNativeView: React.ComponentType<{ children: React.ReactNode }> = requireNativeView(
  'ExpoUI',
  'GridRowView'
);

const GridConentNativeView: React.ComponentType<{ children: React.ReactNode }> = requireNativeView(
  'ExpoUI',
  'GridContentView'
);

const GridContentiew: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <GridConentNativeView>{children}</GridConentNativeView>;
};

const GridRow: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <GridRowNativeView>{children}</GridRowNativeView>;
};

Grid.Row = GridRow;

/**
 * Grid component uses the native [Grid](https://developer.apple.com/documentation/swiftui/grid) component.
 */
export function Grid(props: GridProps) {
  const { modifiers, children, ...restProps } = props;

  return (
    <GridNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}>
      <GridContentiew>{children}</GridContentiew>
    </GridNativeView>
  );
}
