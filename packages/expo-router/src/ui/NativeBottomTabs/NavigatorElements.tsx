import { type ColorValue, type TextStyle } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

// TODO: Replicate the headless tabs API

interface TitleProps {
  children: string;
  style?: {
    fontFamily?: TextStyle['fontFamily'];
    fontSize?: TextStyle['fontSize'];
    fontWeight?: TextStyle['fontWeight'];
    fontStyle?: TextStyle['fontStyle'];
    fontColor?: TextStyle['color'];
  };
}

export function Title(props: TitleProps) {
  return null;
}

type IconProps = { color?: ColorValue } & (
  | {
      sfSymbolName: SFSymbol;
    }
  | { children: React.ReactNode }
);

export function Icon(props: IconProps) {
  return null;
}

interface BadgeProps {
  value: string;
}

export function Badge(props: BadgeProps) {
  return null;
}
