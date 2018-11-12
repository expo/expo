import Branch, { BranchEvent } from 'react-native-branch';
import { Constants } from 'expo-constants';

// Branch has a default and named export, add `BranchEvent` to the default export so it looks
// similar.
Branch.BranchEvent = BranchEvent;

export function warnIfNotStandalone() {
  if (Constants.appOwnership !== 'standalone') {
     console.warn('The Branch API only works with standalone builds created with expo build.');
  }
};

export default Branch;
