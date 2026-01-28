import { type CommonViewModifierProps } from '@expo/ui/swift-ui';
import { requireNativeView } from 'expo';

export interface MyCustomViewProps extends CommonViewModifierProps {
  title: string;
  children?: React.ReactNode;
}

export const MyCustomView = requireNativeView<MyCustomViewProps>('TestExpoUi', 'MyCustomView');
