import { FirebaseNamespaces } from '../constants';
import firebase from '../firebase';
import APPS from './apps';

export default function registerModule(InstanceType) {
  const name = InstanceType.namespace;
  if (!(name in FirebaseNamespaces)) {
    console.error(`FirebaseApp.registerModule: Internal: ${name} is not a valid namespace.`);
    return;
  }
  global.__Expo_Firebase_Modules = global.__Expo_Firebase_Modules || {};
  global.__Expo_Firebase_Modules[name] = InstanceType;

  firebase[name] = APPS.moduleAndStatics(name);
}
