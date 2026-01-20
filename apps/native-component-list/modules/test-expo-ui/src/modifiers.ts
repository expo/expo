import { createModifier } from '@expo/ui/swift-ui/modifiers';

export const customBorder = (params: {
  color?: string;
  width?: number;
  cornerRadius?: number;
}) => createModifier('customBorder', params);
