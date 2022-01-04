import { ClassAttributes, ComponentProps, ComponentType } from 'react';
import Text from './Text';
declare type NativeTextProps = ComponentProps<typeof Text> & ClassAttributes<typeof Text>;
export declare type TableTextProps = NativeTextProps & {
    /** @platform web */
    colSpan?: number | string;
    /** @platform web */
    rowSpan?: number | string;
};
export declare const TableText: ComponentType<TableTextProps>;
export {};
//# sourceMappingURL=Table.d.ts.map