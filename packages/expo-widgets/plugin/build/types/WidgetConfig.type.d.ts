import { WidgetFamily } from './WidgetFamily.type';
export interface WidgetConfig {
    name: string;
    supportedFamilies: WidgetFamily[];
    displayName: string;
    description: string;
}
