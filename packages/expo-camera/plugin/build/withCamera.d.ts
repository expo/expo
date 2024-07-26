import { type ConfigPlugin } from 'expo/config-plugins';
import { type CodeMergeResults } from './appendCode';
/** @internal Exposed for testing */
export declare function addCameraImport(src: string): CodeMergeResults;
declare const _default: ConfigPlugin<void | {
    cameraPermission?: string | false | undefined;
    microphonePermission?: string | false | undefined;
    recordAudioAndroid?: boolean | undefined;
}>;
export default _default;
