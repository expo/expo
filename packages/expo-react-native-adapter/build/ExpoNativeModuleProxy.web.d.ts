declare type AnyDictionary = {
    [key: string]: any;
};
declare type ModulesConstants = {
    [key: string]: AnyDictionary[];
};
declare const _default: {
    readonly name: string;
    readonly exportedMethods: AnyDictionary[];
    readonly viewManagersNames: string[];
    readonly modulesConstants: ModulesConstants;
};
export default _default;
