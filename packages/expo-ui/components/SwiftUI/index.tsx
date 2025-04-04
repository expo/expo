import { requireNativeView } from 'expo';
import { NativeSyntheticEvent, Platform, StyleProp, ViewStyle } from 'react-native';

import { type ViewEvent } from '../../src/types';

//#region Container Component
export type ContainerProps = {
  children: React.ReactNode;
  style: StyleProp<ViewStyle>;
};
const ContainerNativeView: React.ComponentType<ContainerProps> | null =
  Platform.OS === 'ios' ? requireNativeView('ExpoUI', 'SwiftUIContainer') : null;
export function Container(props: ContainerProps) {
  if (!ContainerNativeView) {
    return null;
  }
  return <ContainerNativeView {...props} />;
}
//#endregion

//#region Form Component
export type FormProps = {
  children: React.ReactNode;
};
const FormNativeView: React.ComponentType<FormProps> | null =
  Platform.OS === 'ios' ? requireNativeView('ExpoUI', 'SwiftUIForm') : null;
export function Form(props: FormProps) {
  if (!FormNativeView) {
    return null;
  }
  return <FormNativeView {...props} />;
}
//#endregion

//#region Section Component
export type SectionProps = {
  children: React.ReactNode;
  title: string;
};
const SectionNativeView: React.ComponentType<SectionProps> | null =
  Platform.OS === 'ios' ? requireNativeView('ExpoUI', 'SwiftUISection') : null;
export function Section(props: SectionProps) {
  if (!SectionNativeView) {
    return null;
  }
  return <SectionNativeView {...props} />;
}
//#endregion

//#region Button Component
export type ButtonProps = {
  children: React.ReactNode;
  onPress?: () => void;
};
type NativeButtonProps = Omit<ButtonProps, 'onPress' | 'children'> & {
  text: string;
} & ViewEvent<'onButtonPressed', void>;
const ButtonNativeView: React.ComponentType<NativeButtonProps> | null =
  Platform.OS === 'ios' ? requireNativeView('ExpoUI', 'SwiftUIButton') : null;
function transformButtonProps(props: ButtonProps): NativeButtonProps {
  const { children, onPress, ...restProps } = props;
  return {
    ...restProps,
    text: children?.toString() ?? '',
    onButtonPressed: onPress,
  };
}
export function Button(props: ButtonProps) {
  if (!ButtonNativeView) {
    return null;
  }
  return <ButtonNativeView {...transformButtonProps(props)} />;
}
//#endregion

//#region Picker Component
export type PickerProps = {
  label: string;
  options: string[];
  selectedIndex: number | null;
  onOptionSelected?: (event: { nativeEvent: { index: number; label: string } }) => void;
  variant?: 'automatic';
};
const PickerNativeView: React.ComponentType<PickerProps> | null =
  Platform.OS === 'ios' ? requireNativeView('ExpoUI', 'SwiftUIPicker') : null;
export function Picker(props: PickerProps) {
  if (!PickerNativeView) {
    return null;
  }
  return <PickerNativeView {...props} />;
}
//#endregion

//#region Switch Component
export type SwitchProps = {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};
type NativeSwitchProps = Omit<SwitchProps, 'onValueChange'> & {
  onValueChange: (event: NativeSyntheticEvent<{ value: boolean }>) => void;
};
const SwitchNativeView: React.ComponentType<NativeSwitchProps> | null =
  Platform.OS === 'ios' ? requireNativeView('ExpoUI', 'SwiftUISwitch') : null;
function transformSwitchProps(props: SwitchProps): NativeSwitchProps {
  const { onValueChange, ...restProps } = props;
  return {
    ...restProps,
    onValueChange: (event: NativeSyntheticEvent<{ value: boolean }>) =>
      onValueChange(event.nativeEvent.value),
  };
}
export function Switch(props: SwitchProps) {
  if (!SwitchNativeView) {
    return null;
  }
  return <SwitchNativeView {...transformSwitchProps(props)} />;
}
//#endregion

//#region Text Component
export type TextProps = {
  children: string;
  /**
   * The font weight of the text.
   * Maps to iOS system font weights.
   */
  weight?:
    | 'ultraLight'
    | 'thin'
    | 'light'
    | 'regular'
    | 'medium'
    | 'semibold'
    | 'bold'
    | 'heavy'
    | 'black';
  /**
   * The font design of the text.
   * Maps to iOS system font designs.
   */
  design?: 'default' | 'rounded' | 'serif' | 'monospaced';
  /**
   * The font size of the text.
   */
  size?: number;
  /**
   * The line limit of the text.
   */
  lineLimit?: number;
};
type NativeTextProps = Omit<TextProps, 'children'> & {
  text: string;
};
const TextNativeView: React.ComponentType<Omit<TextProps, 'children'> & { text: string }> | null =
  Platform.OS === 'ios' ? requireNativeView('ExpoUI', 'SwiftUIText') : null;
function transformTextProps(props: TextProps): NativeTextProps {
  const { children, ...restProps } = props;
  return {
    ...restProps,
    text: children ?? '',
  };
}
export function Text(props: TextProps) {
  if (!TextNativeView) {
    return null;
  }
  return <TextNativeView {...transformTextProps(props)} />;
}
//#endregion

type StackBaseProps = {
  children: React.ReactNode;
  spacing?: number;
  padding?: number;
  frame?: {
    width?: number;
    height?: number;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
  };
};

//#region HStack Component
export type HStackProps = StackBaseProps;
const HStackNativeView: React.ComponentType<HStackProps> | null =
  Platform.OS === 'ios' ? requireNativeView('ExpoUI', 'SwiftUIHStack') : null;
export function HStack(props: HStackProps) {
  if (!HStackNativeView) {
    return null;
  }
  return <HStackNativeView {...props} />;
}
//#endregion

//#region VStack Component
export type VStackProps = StackBaseProps;
const VStackNativeView: React.ComponentType<VStackProps> | null =
  Platform.OS === 'ios' ? requireNativeView('ExpoUI', 'SwiftUIVStack') : null;
export function VStack(props: VStackProps) {
  if (!VStackNativeView) {
    return null;
  }
  return <VStackNativeView {...props} />;
}
//#endregion
