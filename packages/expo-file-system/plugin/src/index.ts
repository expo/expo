import { FileSystemProps as Props } from './withFileSystem';

export default (props: Props = {}): [string, Props] => ['expo-file-system', props];
