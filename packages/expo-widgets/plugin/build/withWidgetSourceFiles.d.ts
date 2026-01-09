import { ConfigPlugin } from 'expo/config-plugins';
import { WidgetConfig } from './types/WidgetConfig.type';
interface WidgetSourceFilesProps {
    widgets: WidgetConfig[];
    targetName: string;
    groupIdentifier: string;
    onFilesGenerated: (files: string[]) => void;
}
declare const withWidgetSourceFiles: ConfigPlugin<WidgetSourceFilesProps>;
export default withWidgetSourceFiles;
