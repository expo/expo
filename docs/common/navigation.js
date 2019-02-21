const {
  ROOT,
  INTRODUCTION,
  FUNDAMENTALS,
  GUIDES,
  DISTRIBUTION,
  EXPOKIT,
  REACT_NATIVE,
} = require('./sidebar-navigation-order');
const navigation = require('./navigation-data');
const packageVersion = require('../package.json').version;

const sortAccordingToReference = (arr, reference) => {
  reference = Array.from(reference).reverse();

  let subSort = (arr, i) => arr.slice(0, i).concat(arr.slice(i).sort());

  arr.forEach(category => {
    category.weight = reference.indexOf(category.name) * -1;
  });

  let arrSortedByWeight = arr.sort((a, b) => a.weight - b.weight);
  return subSort(arrSortedByWeight, arrSortedByWeight.findIndex(o => o.weight === 1));
};

const sections = [
  { name: 'Introduction', reference: INTRODUCTION },
  { name: 'Guides', reference: GUIDES },
  { name: 'Distributing Your App', reference: DISTRIBUTION },
  { name: 'ExpoKit', reference: EXPOKIT },
  { name: 'Fundamentals', reference: FUNDAMENTALS },
  { name: 'React Native', reference: REACT_NATIVE },
  // { name: 'React Native Basics', reference: REACT_NATIVE_BASICS, },
  // { name: 'React Native Guides', reference: REACT_NATIVE_GUIDES, },
  // { name: 'React Native Components', reference: REACT_NATIVE_COMPONENTS, },
  // { name: 'React Native APIs', reference: REACT_NATIVE_APIS, },
];

const sortNav = nav => {
  nav = sortAccordingToReference(nav, ROOT);

  sections.forEach(({ name, reference }) => {
    let section = nav.find(o => {
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
