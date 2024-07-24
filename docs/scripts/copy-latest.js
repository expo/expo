// Prepare the latest version by copying the actual exact latest version
import fsExtra from 'fs-extra';
import { join } from 'path';

const { copySync, removeSync, readJsonSync } = fsExtra;
const { version } = readJsonSync('./package.json');

export function copyAsLatest() {
  const vLatest = join('pages', 'versions', `v${version}/`);
  const latest = join('pages', 'versions', 'latest/');
  removeSync(latest);
  copySync(vLatest, latest);
}

copyAsLatest();
