import { warn } from 'danger';
const fs = require('fs');

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
    file => file.startsWith('docs/pages') && file.endsWith('.mdx')
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
      let url = `https://github.com/expo/expo/tree/main/${path}`;
      return `Please consider copying the changes to the [latest released version](${url}) if applicable.`;
    } else if (version === `v${LATEST_VERSION}`) {
      let path = `docs/pages/versions/unversioned/${name}`;
      let url = `https://github.com/expo/expo/tree/main/${path}`;
      return `Please make sure this change won't be lost on the next SDK release by updating the [unversioned copy](${url}).`;
    } else {
      return `You may also want to make these changes to other versions of the documentation, where applicable, in the [docs/pages/versions](https://github.com/expo/expo/tree/main/docs/pages/versions) directory.`;
    }
  }

  Object.keys(groupedByName).forEach(name => {
    let changes = groupedByName[name];
    if (changes.length === 1) {
      let version = getVersionFromPath(changes[0]);
      warn(
        `You modified \`${name}\` in the \`${version}\` directory. ${getSuggestion(version, name)}`
      );
    }
  });
}

// Skip this for now
// warnIfOnlyOneVersionChanged();
