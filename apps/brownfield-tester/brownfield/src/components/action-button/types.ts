import Feather from '@expo/vector-icons/Feather';

export interface ActionButtonProps {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  description?: string;
  onPress: () => void;
  type?: 'button' | 'link';
}
