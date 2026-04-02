import { type ConfigPlugin } from 'expo/config-plugins';
export type WithExpoVideoOptions = {
    /** Whether to enable background playback support. */
    supportsBackgroundPlayback?: boolean;
    /** Whether to enable Picture-in-Picture on Android and iOS. */
    supportsPictureInPicture?: boolean;
};
declare const withExpoVideo: ConfigPlugin<WithExpoVideoOptions>;
export default withExpoVideo;
