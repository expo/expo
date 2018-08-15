import { Constants } from 'expo';
import sha1 from 'sha1';

let _snackId;
export default function getSnackId() {
  if (!_snackId) {
    let hash = sha1(Constants.installationId).toLowerCase();
    _snackId = `${hash.slice(0, 4)}-${hash.slice(4, 8)}`;
  }
  return _snackId;
}
