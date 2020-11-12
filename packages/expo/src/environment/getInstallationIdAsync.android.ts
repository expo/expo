import Application from 'expo-application';

export default function getInstallationIdAsync() {
  return Application.androidId!;
}
