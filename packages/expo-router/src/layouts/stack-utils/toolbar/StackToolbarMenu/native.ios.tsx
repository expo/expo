'use client';
import { useId } from 'react';
import { StyleSheet } from 'react-native';

import { LinkMenuAction } from '../../../../link/elements';
import { NativeLinkPreviewAction } from '../../../../link/preview/native';
import type { NativeToolbarMenuProps } from './types';

/**
 * Native toolbar menu component for bottom toolbar.
 * Renders as NativeLinkPreviewAction.
 */
export const NativeToolbarMenu: React.FC<NativeToolbarMenuProps> = ({
  accessibilityHint,
  accessibilityLabel,
  separateBackground,
  hidesSharedBackground,
  palette,
  inline,
  hidden,
  subtitle,
  title,
  label,
  destructive,
  children,
  icon,
  source,
  xcassetName,
  image,
  imageRenderingMode,
  tintColor,
  variant,
  style,
  elementSize,
}) => {
  const identifier = useId();

  const titleStyle = StyleSheet.flatten(style);
  const renderingMode = imageRenderingMode ?? (tintColor !== undefined ? 'template' : 'original');
  if (process.env.NODE_ENV !== 'production' && source) {
    console.warn(
      'Stack.Toolbar.Menu in placement="bottom" on iOS does not support image icons via the `icon` prop or <Stack.Toolbar.Icon src={...} />; the image will not render. Use the `icon` prop with a string SF Symbol name (e.g. "star.fill"), the `image` prop for a custom image, or <Stack.Toolbar.Icon xcasset="..." /> for an Xcode asset catalog image.'
    );
  }
  return (
    <NativeLinkPreviewAction
      sharesBackground={!separateBackground}
      hidesSharedBackground={hidesSharedBackground}
      hidden={hidden}
      icon={icon}
      xcassetName={xcassetName}
      // TODO(@ubax): Handle image loading using useImage in a follow-up PR.
      image={image}
      imageRenderingMode={renderingMode}
      destructive={destructive}
      subtitle={subtitle}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      displayAsPalette={palette}
      displayInline={inline}
      preferredElementSize={elementSize}
      tintColor={tintColor}
      titleStyle={titleStyle}
      barButtonItemStyle={variant === 'done' ? 'prominent' : variant}
      title={title ?? ''}
      label={label}
      onSelected={() => {}}
      children={children}
      identifier={identifier}
    />
  );
};

/**
 * Native toolbar menu action - reuses LinkMenuAction.
 */
export const NativeToolbarMenuAction = LinkMenuAction;
