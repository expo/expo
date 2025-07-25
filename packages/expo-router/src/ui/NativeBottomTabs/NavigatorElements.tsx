// import type { ColorValue } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';
import type { ImageSourcePropType } from 'react-native';

// TODO: Replicate the headless tabs API

interface TitleProps {
  children: string;
}

export function Title(props: TitleProps) {
  return null;
}

interface IOSIconProps {
  useAsSelected?: boolean;
  name: SFSymbol;
}

export function IOSIcon(props: IOSIconProps) {
  return null;
}

interface AndroidIconProps {
  name: string;
}

export function AndroidIcon(props: AndroidIconProps) {
  return null;
}

interface IconProps {
  useAsSelected?: boolean;
  src: ImageSourcePropType;
}

export function Icon(props: IconProps) {
  return null;
}

interface BadgeProps {
  children?: string;
  // style?: {
  //   backgroundColor?: ColorValue;
  // };
}

export function Badge(props: BadgeProps) {
  return null;
}
