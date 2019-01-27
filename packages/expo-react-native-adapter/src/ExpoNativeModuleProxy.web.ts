type AnyDictionary = {
  [key: string]: any;
};
type ModulesConstants = {
  [key: string]: AnyDictionary[];
};

export default {
  get name(): string {
    return 'ExpoNativeModuleProxy';
  },
  get exportedMethods(): AnyDictionary[] {
    return [];
  },
  get viewManagersNames(): string[] {
    return [];
  },
  get modulesConstants(): ModulesConstants {
    return {};
  },
};
