import { Platform } from 'react-native';

const baseAddress = Platform.select({
  ios: 'http://localhost',
  android: 'http://10.0.2.2',
});
const statusPage = 'status';
const portsToCheck = [8081, 8082, 19000, 19001, 19002, 19003, 19004, 19005];

export type Packager = {
  description: string;
  url: string;
  source: string;
  hideImage: boolean;
};

export async function getLocalPackagersAsync(): Promise<Packager[]> {
  const onlinePackagers: Packager[] = [];

  for (const port of portsToCheck) {
    try {
      const address = `${baseAddress}:${port}`;
      const { status } = await fetch(`${address}/${statusPage}`);
      if (status === 200) {
        onlinePackagers.push({
          description: address,
          url: address,
          source: 'desktop',
          hideImage: true,
        });
      }
    } catch (e) {}
  }

  return onlinePackagers;
}
