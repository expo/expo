/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule FeaturedExperiences
 */
'use strict';

function setReferrer(newReferrer) {
  // NOOP. Shouldn't get here.
}

function getFeatured() {
  return [
    {
      url: 'exp://exp.host/@exponent/react-native-for-curious-people',
      manifest: {
        name: 'React Native for Curious People',
        desc: 'Learn about React Native.',
        iconUrl: 'https://s3.amazonaws.com/rnfcp/icon.png',
      },
    },
    {
      url: 'exp://exp.host/@exponent/pomodoro',
      manifest: {
        name: 'Pomodoro',
        desc: 'Be careful or the tomatoes might explode!',
        iconUrl: 'https://s3.amazonaws.com/pomodoro-exp/icon.png',
      },
    },
    {
      url: 'exp://exp.host/@notbrent/native-component-list',
      manifest: {
        name: 'Native Component List',
        desc: 'Demonstration of some native components.',
        iconUrl: 'https://s3.amazonaws.com/exp-brand-assets/ExponentEmptyManifest_192.png',
      },
    },
  ];
}

module.exports = {
  setReferrer,
  getFeatured,
};
