import { Props } from './withSQLite';

export default (props: Props = {}): [string, Props] => ['expo-sqlite', props];
