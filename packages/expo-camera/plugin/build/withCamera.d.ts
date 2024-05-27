import { ConfigPlugin } from '@expo/config-plugins';
import { MergeResults } from '@expo/config-plugins/build/utils/generateCode';
export declare function addCameraImport(src: string): MergeResults;
declare const _default: ConfigPlugin<void | {
    cameraPermission?: string | false | undefined;
    microphonePermission?: string | false | undefined;
    recordAudioAndroid?: boolean | undefined;
}>;
export default _default;
