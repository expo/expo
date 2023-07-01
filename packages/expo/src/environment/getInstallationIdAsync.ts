import uuidv5 from '@expo/uuid/v5';
import * as Application from 'expo-application';

let installationId: string | null;
const UUID_NAMESPACE = '29cc8a0d-747c-5f85-9ff9-f2f16636d963'; // uuidv5(0, "expo")

export default async function getInstallationIdAsync() {
  if (installationId) {
    return installationId;
  }

  const identifierForVendor = await Application.getIosIdForVendorAsync();
  const bundleIdentifier = Application.applicationId!;

  // It's unlikely identifierForVendor will be null (it returns null if the
  // device has been restarted but not yet unlocked), but let's handle this
  // case.
  if (identifierForVendor) {
    installationId = uuidv5(`${bundleIdentifier}-${identifierForVendor}`, UUID_NAMESPACE) as string;
  } else {
    const installationTime = await Application.getInstallationTimeAsync();
    installationId = uuidv5(
      `${bundleIdentifier}-${installationTime.getTime()}`,
      UUID_NAMESPACE
    ) as string;
  }

  return installationId;
}
