import { type ConfigPlugin } from 'expo/config-plugins';
interface PatchPluginProps {
    /** The directory to search for patch files in. */
    patchRoot?: string;
    /** The maximum changed lines allowed in the patch file, if exceeded the patch will show a warning. */
    changedLinesLimit?: number;
}
export declare const withPatchPlugin: ConfigPlugin<PatchPluginProps | undefined>;
export default withPatchPlugin;
