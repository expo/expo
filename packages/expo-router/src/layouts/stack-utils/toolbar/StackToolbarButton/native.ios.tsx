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
