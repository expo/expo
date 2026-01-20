import { requireNativeView } from 'expo';
import { type CommonViewModifierProps } from '@expo/ui/swift-ui';

export interface MyCustomViewProps extends CommonViewModifierProps {
  title: string;
  children?: React.ReactNode;
}

export const MyCustomView = requireNativeView<MyCustomViewProps>('TestExpoUi', 'MyCustomView');
