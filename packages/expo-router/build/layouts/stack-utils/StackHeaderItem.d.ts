import type { NativeStackHeaderItemCustom } from '@react-navigation/native-stack';
export interface StackHeaderItemProps {
    /**
     * Can be any React node.
     */
    children?: NativeStackHeaderItemCustom['element'];
    hideSharedBackground?: boolean;
}
export declare function StackHeaderItem(props: StackHeaderItemProps): null;
export declare function convertStackHeaderItemPropsToRNHeaderItem(props: StackHeaderItemProps): NativeStackHeaderItemCustom;
//# sourceMappingURL=StackHeaderItem.d.ts.map