export type PackageManagerKey = 'npm' | 'yarn' | 'pnpm' | 'bun';

const STORAGE_KEY = 'expo-docs-terminal-package-manager';
export const PACKAGE_MANAGER_ORDER: PackageManagerKey[] = ['npm', 'yarn', 'pnpm', 'bun'];
const PACKAGE_MANAGER_SET = new Set<PackageManagerKey>(PACKAGE_MANAGER_ORDER);

type PackageManagerStore = {
  value: PackageManagerKey | null;
  initialized: boolean;
  listeners: Set<() => void>;
  storageListenerAttached: boolean;
};

const packageManagerStore: PackageManagerStore = {
  value: null,
  initialized: false,
  listeners: new Set(),
  storageListenerAttached: false,
};

const getStoredManager = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored && PACKAGE_MANAGER_SET.has(stored as PackageManagerKey)
    ? (stored as PackageManagerKey)
    : null;
};

const initPackageManagerStore = () => {
  if (packageManagerStore.initialized) {
    return;
  }
  packageManagerStore.initialized = true;
  const stored = getStoredManager();
  if (stored) {
    packageManagerStore.value = stored;
  }
};

const notifyPackageManagerStore = () => {
  packageManagerStore.listeners.forEach(listener => {
    listener();
  });
};

const updatePackageManagerStore = (manager: PackageManagerKey | null) => {
  if (packageManagerStore.value === manager) {
    return;
  }
  packageManagerStore.value = manager;
  notifyPackageManagerStore();
};

const ensureStorageListener = () => {
  if (packageManagerStore.storageListenerAttached || typeof window === 'undefined') {
    return;
  }
  packageManagerStore.storageListenerAttached = true;
  window.addEventListener('storage', event => {
    if (event.key !== STORAGE_KEY) {
      return;
    }
    const nextValue =
      event.newValue && PACKAGE_MANAGER_SET.has(event.newValue as PackageManagerKey)
        ? (event.newValue as PackageManagerKey)
        : null;
    updatePackageManagerStore(nextValue);
  });
};

export const subscribePackageManagerStore = (listener: () => void) => {
  initPackageManagerStore();
  ensureStorageListener();
  packageManagerStore.listeners.add(listener);
  return () => {
    packageManagerStore.listeners.delete(listener);
  };
};

export const getPackageManagerSnapshot = () => {
  initPackageManagerStore();
  return packageManagerStore.value;
};

export const getPackageManagerServerSnapshot = () => null;

export const setPackageManagerPreference = (manager: PackageManagerKey) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, manager);
  }
  updatePackageManagerStore(manager);
};
