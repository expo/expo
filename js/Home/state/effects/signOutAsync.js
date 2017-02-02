import LocalStorage from '../LocalStorage';

export default async function signOutAsync() {
  await LocalStorage.clearAllAsync();
}
