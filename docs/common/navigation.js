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
const navigation = require('./navigation-data');
const packageVersion = require('../package.json').version;

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

const sections = [
  { name: 'Introduction', reference: INTRODUCTION },
  { name: 'Guides', reference: GUIDES },
  { name: 'Distributing Your App', reference: DISTRIBUTION },
  { name: 'ExpoKit', reference: EXPOKIT },
  { name: 'Working with Expo', reference: WORKING_WITH_EXPO },
  { name: 'React Native', reference: REACT_NATIVE },
  // { name: 'React Native Basics', reference: REACT_NATIVE_BASICS, },
  // { name: 'React Native Guides', reference: REACT_NATIVE_GUIDES, },
  // { name: 'React Native Components', reference: REACT_NATIVE_COMPONENTS, },
  // { name: 'React Native APIs', reference: REACT_NATIVE_APIS, },
];

const sortNav = nav => {
  nav = sortAccordingToReference(nav, ROOT);

  sections.forEach(({ name, reference }) => {
    let section = _.find(nav, o => {
      return o.name.toLowerCase() === name.toLowerCase();
    });
    if (section) {
      section.posts = sortAccordingToReference(section.posts, reference);
    }
  });

  return nav;
};

const sortedNavigation = Object.assign(
  ...Object.entries(navigation).map(([version, versionNavigation]) => ({
    [version]: sortNav(versionNavigation),
  }))
);

module.exports = { ...sortedNavigation, latest: sortedNavigation['v' + packageVersion] };
