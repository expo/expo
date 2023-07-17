export enum ResourcePlatform {
  ANDROID = 'android',
  IOS = 'ios',
}

export enum ResourceTier {
  MEDIUM = 'medium',
  LARGE = 'large',
}

type HardwareSpec = {
  cpu: string;
  memory: string;
  description: string;
  name: string;
};

export type HardwareSpecs = Record<string, HardwareSpec>;

export type HardwareSpecKey = keyof HardwareSpecs;

type HardwareLSpec = {
  vm: string;
  extra: string;
};

export type HardwareRSpec = object | Record<HardwareSpecKey, HardwareLSpec>;

type ResourceSpec = {
  name: string;
  symbol: string;
  hardware: HardwareRSpec;
};

type PlatformSpec = Record<string, ResourceSpec>;

type ResourceSpecs = {
  [keyof in ResourcePlatform]: PlatformSpec;
};

type VMSpec = {
  cpu: string;
  memory: string;
};

type ResourceSpecData = {
  resources: ResourceSpecs;
  hardware: HardwareSpecs;
  vm: Record<string, VMSpec>;
};
