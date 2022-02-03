import { ConfigPlugin } from '@expo/config-plugins';
import { MergeResults } from '@expo/config-plugins/build/utils/generateCode';
export declare function addCameraImport(src: string): MergeResults;
declare const _default: ConfigPlugin<void | {
    cameraPermission?: string | undefined;
    microphonePermission?: string | undefined;
}>;
export default _default;
