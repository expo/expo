import { PluginConfig as Props } from './withWebBrowserAndroid';

export default (props: Props = {}): [string, Props] => ['expo-web-browser', props];
