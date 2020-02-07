import { ClassAttributes, ComponentProps, ComponentType } from 'react';
import Text from '../primitives/Text';
declare type NativeTextProps = ComponentProps<typeof Text> & ClassAttributes<typeof Text>;
export declare type TableTextProps = NativeTextProps & {
    colspan?: number;
    rowspan?: number;
};
export declare const TableText: ComponentType<TableTextProps>;
export {};
