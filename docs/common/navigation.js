const {
  ROOT,
  GROUPS,
  ESSENTIALS,
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
  { name: 'Essentials', reference: ESSENTIALS },
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

// Yikes, this groups together multiple sections under one heading
const groupNav = nav => {
  let sections = [];
  let groupIndex = {};
  nav.forEach(section => {
    if (section.name === 'Expo SDK') {
      let overview;
      section.posts.forEach(post => {
        if (post.name === 'Overview') {
          overview = post;
        }
      });
      if (overview) {
        section.posts.splice(section.posts.indexOf(overview), 1);
        section.posts.unshift(overview);
      }
    }
    let group = GROUPS[section.name];
    if (group) {
      let existingGroupIndex = groupIndex[group];
      if (existingGroupIndex) {
        sections[existingGroupIndex].children.push(section);
      } else {
        groupIndex[group] = sections.length;
        sections.push({
          name: group,
          children: [section],
        });
      }
    } else {
      sections.push(section);
    }
  });

  return sections;
};

const sortedNavigation = Object.assign(
  ...Object.entries(navigation).map(([version, versionNavigation]) => ({
    [version]: groupNav(sortNav(versionNavigation)),
  }))
);

module.exports = { ...sortedNavigation, latest: sortedNavigation['v' + packageVersion] };
