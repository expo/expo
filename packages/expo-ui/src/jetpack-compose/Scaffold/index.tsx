import { requireNativeView } from 'expo';
import React from 'react';
import { View } from 'react-native';

import { ExpoModifier } from '../../types';

export type ScaffoldProps = {
  /**
   * Top bar content (e.g., `<AppBarWithSearch>`).
   */
  topBar?: React.ReactElement;
  /**
   * Bottom bar content (e.g., a navigation bar).
   */
  bottomBar?: React.ReactElement;
  /**
   * Floating action button content.
   */
  floatingActionButton?: React.ReactElement;
  /**
   * Main content rendered inside the scaffold.
   */
  children?: React.ReactNode;
  /**
   * Modifiers for the component.
   */
  modifiers?: ExpoModifier[];
};

type NativeScaffoldProps = {
  hasTopBar: boolean;
  hasBottomBar: boolean;
  hasFloatingActionButton: boolean;
  children?: React.ReactNode;
  modifiers?: ExpoModifier[];
};

const ScaffoldNativeView: React.ComponentType<NativeScaffoldProps> = requireNativeView(
  'ExpoUI',
  'ScaffoldView'
);

const Empty = <View />;

/**
 * Renders a Material 3 `Scaffold` layout with named slots for top bar, bottom bar,
 * floating action button, and main content.
 */
export function Scaffold({
  topBar,
  bottomBar,
  floatingActionButton,
  children,
  modifiers,
}: ScaffoldProps) {
  return (
    <ScaffoldNativeView
      hasTopBar={topBar != null}
      hasBottomBar={bottomBar != null}
      hasFloatingActionButton={floatingActionButton != null}
      modifiers={modifiers}>
      {topBar ?? Empty}
      {bottomBar ?? Empty}
      {floatingActionButton ?? Empty}
      {/* TODO: Find a way to pass the nativ size to this yoga node */}
      <View style={{ width: '100%', height: 500 }}>{children ?? Empty}</View>
    </ScaffoldNativeView>
  );
}
