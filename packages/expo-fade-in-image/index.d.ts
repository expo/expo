import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';

export interface FadeInProps {
  style?: StyleProp<ViewStyle>;
  renderPlaceholderContent?: React.ReactNode;
  placeholderStyle?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export default class FadeIn extends React.Component<FadeInProps> {}
