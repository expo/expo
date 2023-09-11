export type Dependency = {
  name: string;
  path: string;
};

export type DetoxApplication = {
  preset: 'detox';
  detoxConfigFile: string;
  appEntryPoint: string;
  additionalFiles: string[];
  android?: {
    detoxTestFile?: string;
  };
  tests: { [key: string]: DetoxTest };
};

export type Application = {
  reactVersion: string;
  reactNativeVersion: string;
  dependencies?: Dependency[];
  android?: {
    mainApplication?: string;
    mainActivity?: string;
  };
  ios?: {
    appDelegateHeader?: string;
    appDelegate?: string;
  };
  tests: { [key: string]: Test };
} & DetoxApplication;

export type Test = object;

export type DetoxTest = { shouldRunBundler: boolean; configurations: string[] };

export type Config = {
  applications: { [key: string]: Application };
};
