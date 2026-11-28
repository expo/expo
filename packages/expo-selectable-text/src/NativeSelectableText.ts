import type { HostComponent, NativeSyntheticEvent, TextProps } from 'react-native';
import { createViewConfig } from 'react-native/Libraries/NativeComponent/ViewConfig';
import { dispatchCommand } from 'react-native/Libraries/ReactNative/RendererProxy';
import createReactNativeComponentClass from 'react-native/Libraries/Renderer/shims/createReactNativeComponentClass';

export type SelectionMenuItem = {
  id: string;
  title: string;
};

export type SelectionMenuActionEvent = {
  /** The `id` of the menu item that the user pressed. */
  id: string;
  /** The selected text. */
  selectedText: string;
  /** The start of the selection, as a UTF-16 index into the text. */
  start: number;
  /** The end of the selection, as a UTF-16 index into the text. */
  end: number;
};

export type NativeSelectableTextProps = TextProps & {
  isHighlighted?: boolean;
  isPressable?: boolean;
  onClick?: unknown;
  onMenuAction?: (event: NativeSyntheticEvent<SelectionMenuActionEvent>) => void;
};

// The attributes of React Native's `RCTText` view config, which React Native
// also gives to `RCTSelectableText` (`Libraries/Text/TextNativeComponent.js`).
const textValidAttributes = {
  isHighlighted: true,
  isPressable: true,
  numberOfLines: true,
  ellipsizeMode: true,
  allowFontScaling: true,
  dynamicTypeRamp: true,
  maxFontSizeMultiplier: true,
  disabled: true,
  selectable: true,
  selectionColor: true,
  adjustsFontSizeToFit: true,
  minimumFontScale: true,
  textBreakStrategy: true,
  onTextLayout: true,
  dataDetectorType: true,
  android_hyphenationFrequency: true,
  lineBreakStrategyIOS: true,
};

export const NativeSelectableText = createReactNativeComponentClass('ExpoSelectableText', () =>
  createViewConfig({
    validAttributes: textValidAttributes,
    directEventTypes: {
      topTextLayout: { registrationName: 'onTextLayout' },
      topMenuAction: { registrationName: 'onMenuAction' },
    },
    uiViewClassName: 'ExpoSelectableText',
  })
) as unknown as HostComponent<NativeSelectableTextProps>;

/**
 * Sends the menu items as a view command, so that React Native's `ParagraphProps`
 * stay the props of this component.
 */
export function setMenuItems(handle: unknown, items: SelectionMenuItem[]) {
  dispatchCommand(handle, 'setMenuItems', [items]);
}
