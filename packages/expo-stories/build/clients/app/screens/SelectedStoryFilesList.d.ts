/// <reference types="react" />
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
type SelectedStoryFilesListProps = {
    navigation: StackNavigationProp<RootStackParamList, 'Selected Stories'>;
    route: RouteProp<RootStackParamList, 'Selected Stories'>;
};
export declare function SelectedStoryFilesList({ navigation, route }: SelectedStoryFilesListProps): JSX.Element;
export {};
//# sourceMappingURL=SelectedStoryFilesList.d.ts.map