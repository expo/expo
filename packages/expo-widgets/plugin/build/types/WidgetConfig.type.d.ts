import { WidgetFamily } from './WidgetFamily.type';
export type WidgetConfig = {
    name: string;
    supportedFamilies: WidgetFamily[];
    displayName: string;
    description: string;
};
