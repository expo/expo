import { type ConfigPlugin } from 'expo/config-plugins';
export type WithExpoVideoProps = {
    supportsBackgroundPlayback?: boolean;
    supportsPictureInPicture?: boolean;
};
declare const withExpoVideo: ConfigPlugin<WithExpoVideoProps | void>;
export default withExpoVideo;
