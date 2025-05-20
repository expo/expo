import { NavigationProp, NavigationState } from '@react-navigation/native';
import { ScrollView } from 'react-native';
import type { useNavigation } from '../../useNavigation';
interface Args {
    navigation: ReturnType<typeof useNavigation<Omit<NavigationProp<ReactNavigation.RootParamList>, 'getState'> & {
        getState(): NavigationState | undefined;
    }>>;
    topInset: number;
}
export declare function useScrollOnSelect({ navigation, topInset }: Args): {
    scrollViewRef: import("react").RefObject<ScrollView | null>;
};
export {};
//# sourceMappingURL=useScrollOnSelect.d.ts.map