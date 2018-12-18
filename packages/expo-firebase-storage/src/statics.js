import { NativeModulesProxy } from 'expo-core';
import { utils } from 'expo-firebase-app';

const { stripTrailingSlash } = utils;

const { ExpoFirebaseStorage } = NativeModulesProxy;

const statics = {
  TaskEvent: {
    STATE_CHANGED: 'state_changed',
  },
  TaskState: {
    RUNNING: 'running',
    PAUSED: 'paused',
    SUCCESS: 'success',
    CANCELLED: 'cancelled',
    ERROR: 'error',
  },
  Native: ExpoFirebaseStorage
    ? {
        MAIN_BUNDLE_PATH: stripTrailingSlash(ExpoFirebaseStorage.MAIN_BUNDLE_PATH),
        CACHES_DIRECTORY_PATH: stripTrailingSlash(ExpoFirebaseStorage.CACHES_DIRECTORY_PATH),
        DOCUMENT_DIRECTORY_PATH: stripTrailingSlash(ExpoFirebaseStorage.DOCUMENT_DIRECTORY_PATH),
        EXTERNAL_DIRECTORY_PATH: stripTrailingSlash(ExpoFirebaseStorage.EXTERNAL_DIRECTORY_PATH),
        EXTERNAL_STORAGE_DIRECTORY_PATH: stripTrailingSlash(
          ExpoFirebaseStorage.EXTERNAL_STORAGE_DIRECTORY_PATH
        ),
        TEMP_DIRECTORY_PATH: stripTrailingSlash(ExpoFirebaseStorage.TEMP_DIRECTORY_PATH),
        LIBRARY_DIRECTORY_PATH: stripTrailingSlash(ExpoFirebaseStorage.LIBRARY_DIRECTORY_PATH),
        FILETYPE_REGULAR: stripTrailingSlash(ExpoFirebaseStorage.FILETYPE_REGULAR),
        FILETYPE_DIRECTORY: stripTrailingSlash(ExpoFirebaseStorage.FILETYPE_DIRECTORY),
      }
    : {},
};

export default statics;
