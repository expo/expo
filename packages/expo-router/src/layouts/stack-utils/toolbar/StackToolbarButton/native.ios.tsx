'use client';
import { useId } from 'react';
import { Platform, StyleSheet } from 'react-native';

import { RouterToolbarItem } from '../../../../toolbar/native';
import type { RouterToolbarItemProps } from '../../../../toolbar/native.types';
import type { NativeToolbarButtonProps } from './types';

/**
 * Native toolbar button component for bottom toolbar.
 * Renders as RouterToolbarItem.
 */
export const NativeToolbarButton: React.FC<NativeToolbarButtonProps> = (props) => {
  const id = useId();
  const renderingMode =
    props.imageRenderingMode ?? (props.tintColor !== undefined ? 'template' : 'original');
  // The cast is needed because `badge.style.fontWeight` is typed as `string`. The value comes from
  // `convertTextStyleToRNTextStyle`, which already returns a weight that `BasicTextStyle` accepts.
  const badgeConfiguration = props.badge
    ? ({
        ...props.badge.style,
        value: props.badge.value === '' ? undefined : String(props.badge.value),
      } as RouterToolbarItemProps['badgeConfiguration'])
    : undefined;
  if (
    process.env.NODE_ENV !== 'production' &&
    props.badge &&
    Number.parseInt(String(Platform.Version), 10) < 27
  ) {
    console.warn(
      'Stack.Toolbar.Badge on Stack.Toolbar.Button in placement="bottom" is not displayed on iOS versions earlier than 27. UIKit does not draw the badge on a bottom toolbar item there, so the badge is ignored. Run the app on iOS 27 or later to see the badge.'
    );
  }
  if (process.env.NODE_ENV !== 'production' && props.source) {
    console.warn(
      'Stack.Toolbar.Button in placement="bottom" on iOS does not support image icons via the `icon` prop or <Stack.Toolbar.Icon src={...} />; the image will not render. Use the `icon` prop with a string SF Symbol name (e.g. "star.fill"), the `image` prop for a custom image, or <Stack.Toolbar.Icon xcasset="..." /> for an Xcode asset catalog image.'
    );
  }
  return (
    <RouterToolbarItem
      accessibilityHint={props.accessibilityHint}
      accessibilityLabel={props.accessibilityLabel}
      badgeConfiguration={badgeConfiguration}
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
