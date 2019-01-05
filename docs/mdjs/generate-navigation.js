const path = require('path');
const fm = require('front-matter');
const fs = require('fs-extra');
const _ = require('lodash');
const {
  ROOT,
  INTRODUCTION,
  WORKING_WITH_EXPO,
  GUIDES,
  DISTRIBUTION,
  EXPOKIT,
  REACT_NATIVE,
} = require('./sidebar-navigation-order');

const DIR_MAPPING = {
  introduction: 'Introduction',
  guides: 'Guides',
  tutorials: 'Tutorials',
  sdk: 'SDK API Reference',
  "react-native": "React Native",
  // "react-native-apis": 'React Native APIs',
  // 'react-native-components': 'React Native Components',
  // 'react-native-guides': 'React Native Guides',
  // 'react-native-basics': 'React Native Basics',
  workflow: 'Working with Expo',
  distribution: 'Distributing Your App',
  expokit: 'ExpoKit',
};

const sortAccordingToReference = (arr, reference) => {
  reference = _.clone(reference);
  reference.reverse();

  let subSort = (arr, i) => arr.slice(0, i).concat(arr.slice(i).sort());

  arr.forEach(category => {
    category.weight = reference.indexOf(category.name) * -1;
  });

  let arrSortedByWeight = _.sortBy(arr, ['weight']);
  return subSort(arrSortedByWeight, _.findIndex(arrSortedByWeight, { weight: 1 }));
};

let sections = [
  { name: 'Introduction', reference: INTRODUCTION },
  { name: 'Guides', reference: GUIDES },
  { name: 'Distributing Your App', reference: DISTRIBUTION },
  { name: 'ExpoKit', reference: EXPOKIT },
  { name: 'Working with Expo', reference: WORKING_WITH_EXPO },
  { name: "React Native", reference: REACT_NATIVE,}
  // { name: 'React Native Basics', reference: REACT_NATIVE_BASICS, },
  // { name: 'React Native Guides', reference: REACT_NATIVE_GUIDES, },
  // { name: 'React Native Components', reference: REACT_NATIVE_COMPONENTS, },
  // { name: 'React Native APIs', reference: REACT_NATIVE_APIS, },
];

const sortNav = nav => {
  nav = sortAccordingToReference(nav, ROOT);

  sections.forEach(({ name, reference }) => {
    let section = _.find(nav, o => {
      console.log(o);
      return o.name.toLowerCase() === name.toLowerCase();
    });
    if (section) {
      section.posts = sortAccordingToReference(section.posts, reference);
    }
  });

  return nav;
};

const generateNavLinks = (path_, arr) => {
  let items = fs.readdirSync(path_);

  let processUrl = path => {
    let newPath = path.replace(/^versions/, '/versions').replace(/.md$/, '/');
    return newPath;
  };

  for (var i = 0; i < items.length; i++) {
    const filePath = path.join(path_, items[i]);
    if (fs.statSync(filePath).isDirectory()) {
      const { name } = path.parse(filePath);
      let initArr = [];

      // Make sure to add '/' at the end of index pages so that relative links in the markdown work correctly
      let href = fs.existsSync(filePath + '/index.md') ? processUrl(filePath) + '/' : '';

      // 'Introduction' section has a 'Quick Start' page that's actually at the root i.e. `/versions/v25.0/`, etc.
      if (name === 'introduction') {
        // TODO: find what's eating the final slash
        initArr.push({ name: 'Quick Start', href: path.parse(href).dir + '//' });
      }
      // 'SDK' section has a 'Introduction' page that's the same as the index page
      if (name === 'sdk') {
        initArr.push({ name: 'Introduction', href });
      }

      arr.push({
        name: DIR_MAPPING[name.toLowerCase()],
        href,
        posts: generateNavLinks(filePath, initArr),
      });
    } else {
      const { ext, name } = path.parse(filePath);
      // Only process markdown files that are not index pages
      if (ext === '.md' && name !== 'index') {
        try {
          let title = fm(fs.readFileSync(filePath, 'utf8')).attributes.title;
          let obj = {
            name: title,
            href: processUrl(filePath),
          };
          arr.push(obj);
        } catch (e) {
          console.log(`Error reading frontmatter of ${filePath}`, e);
        }
      }
    }
  }

  return arr;
};

module.exports = path_ => {
  return sortNav(generateNavLinks(path_, []));
};
