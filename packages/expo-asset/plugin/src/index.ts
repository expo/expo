import { AssetProps as Props } from './withAssets';

export default (props: Props = {}): [string, Props] => ['expo-asset', props];
