'use client';
import { useId } from 'react';
import { StyleSheet } from 'react-native';

import type { NativeToolbarButtonProps } from './types';
import { RouterToolbarItem } from '../../../../toolbar/native';

/**
 * Native toolbar button component for bottom toolbar.
 * Renders as RouterToolbarItem.
 */
export const NativeToolbarButton: React.FC<NativeToolbarButtonProps> = (props) => {
  const id = useId();
  const renderingMode =
    props.imageRenderingMode ?? (props.tintColor !== undefined ? 'template' : 'original');
  if (process.env.NODE_ENV !== 'production' && props.source) {
    console.warn(
      'Stack.Toolbar.Button in placement="bottom" on iOS does not support image icons via the `icon` prop or <Stack.Toolbar.Icon src={...} />; the image will not render. Use the `icon` prop with a string SF Symbol name (e.g. "star.fill"), the `image` prop for a custom image, or <Stack.Toolbar.Icon xcasset="..." /> for an Xcode asset catalog image.'
    );
  }
  return (
    <RouterToolbarItem
      accessibilityHint={props.accessibilityHint}
      accessibilityLabel={props.accessibilityLabel}
      barButtonItemStyle={props.variant === 'done' ? 'prominent' : props.variant}
      disabled={props.disabled}
      hidden={props.hidden}
      hidesSharedBackground={props.hidesSharedBackground}
      identifier={id}
      image={props.image}
      imageRenderingMode={renderingMode}
      onSelected={props.onPress}
      possibleTitles={props.possibleTitles}
      selected={props.selected}
      sharesBackground={!props.separateBackground}
      systemImageName={props.icon}
      xcassetName={props.xcassetName}
      title={props.label}
      tintColor={props.tintColor}
      titleStyle={StyleSheet.flatten(props.style)}
    />
  );
};
