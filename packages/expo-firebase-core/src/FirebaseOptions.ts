//import { CodedError } from '@unimodules/core';
//import Constants from 'expo-constants';

export interface IFirebaseOptions {
  appId: string;
  apiKey: string;
  databaseURL: string;
  trackingId: string;
  messagingSenderId: string;
  storageBucket: string;
  projectId: string;
  //authDomain: string;
}

export class FirebaseOptions {
  /*static parseAndroidGoogleServices(json: any, packageName?: string): IFirebaseOptions {
    // TODO make this solid
    const projectInfo = json['project_info'];
    const client = json.client[0];
    const projectId = projectInfo.project_id;
    const messagingSenderId = projectInfo.project_number;
    const databaseURL = projectInfo.firebase_url;
    const storageBucket = projectInfo.storage_bucket;
    const appId = client.client_info.mobilesdk_app_id;
    const analyticsService = client.services['analytics-service'];
    const trackingId = analyticsService
      ? analyticsService.analytics_property.tracking_id
      : undefined;
    const apiKey = client.api_key[0].current_key;
    //const authDomain = `${projectId}.firebaseapp.com`;
    return {
      appId,
      trackingId,
      apiKey,
      projectId,
      messagingSenderId,
      databaseURL,
      storageBucket,
      //authDomain,
    };
  }*/
}

/*export function getFirebaseOptionsFromAndroidManifest(): FirebaseOptions {
  const { manifest } = Constants;
  if (!manifest) throw new CodedError('ERR_MANIFEST', 'Manifest not available');
  const { googleServicesFile } = manifest;
  if (!googleServicesFile)
    throw new CodedError('ERR_MANIFEST', 'GoogleServicesFile is not configured in app.json');
  const json = JSON.parse(googleServicesFile);
  return getFirebaseOptionsFromAndroidGoogleServicesFile(json);
}

export function getFirebaseOptionsFromManifest(): FirebaseOptions {
  return getFirebaseOptionsFromAndroidManifest();
}*/
