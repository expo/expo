import { ConfigPlugin } from 'expo/config-plugins';
import { WidgetConfig } from './types/WidgetConfig.type';
type WidgetSourceFilesProps = {
    targetName: string;
    groupIdentifier: string;
    widgets: WidgetConfig[];
    onFilesGenerated: (files: string[]) => void;
};
declare const withWidgetSourceFiles: ConfigPlugin<WidgetSourceFilesProps>;
export default withWidgetSourceFiles;
