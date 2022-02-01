import { ExpoConfig, getAccountUsername, getDefaultTarget } from '@expo/config';
import JsonFile, { JSONValue } from '@expo/json-file';
import resolveFrom from 'resolve-from';

function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache: { [key: string]: any } = {};
  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    if (cache[key]) {
      return cache[key];
    }
    const result = fn(...args);
    cache[key] = result;
    return result;
  }) as any;
}

const getAccountName = memoize((exp: Pick<ExpoConfig, 'owner'>) => {
  return getAccountUsername(exp);
});

const getDevClientVersion = memoize((projectRoot: string): JSONValue | undefined => {
  try {
    const devClientPackage = resolveFrom.silent(projectRoot, 'expo-dev-client/package.json');
    if (devClientPackage) {
      return JsonFile.read(devClientPackage).version;
    }
  } catch {}
  return undefined;
});

const getProjectType = memoize((projectRoot: string): 'managed' | 'generic' => {
  return getDefaultTarget(projectRoot) === 'managed' ? 'managed' : 'generic';
});

export default function getDevClientProperties(projectRoot: string, exp: ExpoConfig) {
  return {
    account_name: getAccountName({ owner: exp.owner }),
    dev_client_version: getDevClientVersion(projectRoot),
    project_type: getProjectType(projectRoot),
    uptime_ms: process.uptime() * 1000,
  };
}
