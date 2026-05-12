import type { ParamListBase } from '../routers';
import type { NavigationProp } from './types';
type Options = {
    key?: string;
    navigation?: NavigationProp<ParamListBase>;
    options?: object | undefined;
};
export declare function useOptionsGetters({ key, options, navigation }: Options): {
    addOptionsGetter: (key: string, getter: () => object | undefined | null) => () => void;
    getCurrentOptions: () => object | null | undefined;
};
export {};
//# sourceMappingURL=useOptionsGetters.d.ts.map