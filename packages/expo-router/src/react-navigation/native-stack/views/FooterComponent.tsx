import React from 'react';
import { ScreenFooter } from 'react-native-screens';

type FooterProps = {
  children?: React.ReactNode;
};

export function FooterComponent({ children }: FooterProps) {
  return <ScreenFooter collapsable={false}>{children}</ScreenFooter>;
}
