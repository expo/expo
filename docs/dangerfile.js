import { warn } from 'danger';
import fs from 'fs';

function warnIfOnlyOneVersionChanged() {
  const LATEST_VERSION = JSON.parse(fs.readFileSync('./package.json')).version;

  function getPageName(path) {
    let version = getVersionFromPath(path);
    return path.replace('docs/pages/versions/', '').replace(`${version}/`, '');
  }

  function getVersionFromPath(path) {
    return path.replace('docs/pages/versions/', '').split('/')[0];
  }

  let pages = danger.git.modified_files.filter(
    file => file.startsWith('docs/pages') && file.endsWith('.md')
  );

  let groupedByName = pages.reduce((all, path) => {
    let pageName = getPageName(path);
    all[pageName] = all[pageName] || [];
    all[pageName].push(path);
    return all;
  }, {});

  function getSuggestion(version, name) {
    if (version === 'unversioned') {
      let path = `docs/pages/versions/v${LATEST_VERSION}/${name}`;
      let url = `https://github.com/expo/expo/blob/master/${path}`;
      return `If it makes sense to do so, please also apply this change to the latest version at [${path}](${url}).`;
    } else if (version === `v${LATEST_VERSION}`) {
      let path = `docs/pages/versions/unversioned/${name}`;
      let url = `https://github.com/expo/expo/blob/master/${path}`;
      return `If it makes sense to do so, please make sure this change won't be lost on the next released by changing the unversioned copy at [${path}](${url}) as well.`;
    } else {
      return `You may also want to apply this change to other versions of the documentation in the [docs/pages/versions](https://github.com/expo/expo/tree/master/docs/pages/versions) directory.`;
    }
  }

  Object.keys(groupedByName).forEach(name => {
    let changes = groupedByName[name];
    if (changes.length === 1) {
      let version = getVersionFromPath(changes[0]);
      warn(
        `You modified ${name} in the "pages/${version}" directory. ${getSuggestion(version, name)}`
      );
    }
  });
}

warnIfOnlyOneVersionChanged();
