import Storage from 'expo-sqlite/kv-store';
import { AppState } from 'react-native';

export const STORAGE_KEY = '@notification_bg_store';

export type AddItemToStorageParams = {
  source: string;
  data: any;
};

export const getStorageItemSync = () => {
  return Storage.getItemSync(STORAGE_KEY);
};

export const removeItemSync = () => {
  Storage.removeItemSync(STORAGE_KEY);
};

export const addItemToStorage = ({ source, data }: AddItemToStorageParams) => {
  const currentEntry = Storage.getItemSync(STORAGE_KEY);
  Storage.setItemSync(
    STORAGE_KEY,
    JSON.stringify([
      {
        source,
        time: new Date().toISOString(),
        appState: AppState.currentState,
        data,
      },
      ...JSON.parse(currentEntry || '[]'),
    ])
  );
};
