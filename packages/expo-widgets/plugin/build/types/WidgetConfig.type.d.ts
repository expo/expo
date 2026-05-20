import { WidgetFamily } from './WidgetFamily.type';
export type WidgetConfig = {
    name: string;
    supportedFamilies: WidgetFamily[];
    displayName: string;
    description: string;
    contentMarginsDisabled: boolean;
    configuration?: {
        title: string;
        description?: string;
        parameters: Record<string, WidgetParameter>;
    };
};
export type WidgetParameterString = {
    title: string;
    type: 'string';
    default: string;
};
export type WidgetParameterNumber = {
    title: string;
    type: 'number';
    default: number;
};
export type WidgetParameterBoolean = {
    title: string;
    type: 'boolean';
    default: boolean;
};
export type WidgetParameterEnum = {
    title: string;
    type: 'enum';
    values: {
        name: string;
        value: string;
    }[];
    default: string;
};
export type WidgetParameter = WidgetParameterString | WidgetParameterNumber | WidgetParameterBoolean | WidgetParameterEnum;
