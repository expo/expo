import { getPackageChangelogRelativePath } from '../Utils';

it('getPackageChangelogRelativePath', () => {
  const packageName = 'expo-image-picker';
  const result = getPackageChangelogRelativePath(packageName);
  expect(result).toEqual(`packages/${packageName}/CHANGELOG.md`);
});
