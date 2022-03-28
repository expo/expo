import { NativeModules } from 'react-native';

export type EXUpdatesConfig = {
  runtimeVersion: string;
  sdkVersion: string;
  appId: string;
  isEASUpdates: boolean;
};

type EXUpdatesDevExtension = {
  getUpdatesConfigAsync: () => Promise<EXUpdatesConfig>;
};

const defaultUpdatesConfig: EXUpdatesConfig = {
  runtimeVersion: '',
  sdkVersion: '',
  appId: '',
  isEASUpdates: false,
};

export async function getUpdatesConfigAsync() {
  if (isUpdatesInstalled()) {
    return await EXUpdates.getUpdatesConfigAsync();
  }

  return defaultUpdatesConfig;
}

export const EXUpdates = NativeModules.EXUpdatesDevExtension as EXUpdatesDevExtension;
export const isUpdatesInstalled = () => NativeModules.EXUpdatesDevExtension != null;
