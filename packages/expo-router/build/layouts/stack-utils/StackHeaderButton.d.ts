import type { NativeStackHeaderItemButton } from '@react-navigation/native-stack';
import { type StackHeaderItemSharedProps } from './shared';
export interface StackHeaderButtonProps extends StackHeaderItemSharedProps {
    onPress?: () => void;
    selected?: boolean;
}
export declare function StackHeaderButton(props: StackHeaderButtonProps): null;
export declare function convertStackHeaderButtonPropsToRNHeaderItem(props: StackHeaderButtonProps): NativeStackHeaderItemButton;
//# sourceMappingURL=StackHeaderButton.d.ts.map