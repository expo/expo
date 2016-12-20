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
    {
      url: 'exp://exp.host/@exponent/floatyplane',
      manifest: {
        name: 'Floaty Plane',
        desc: 'Touch the plane until you die!',
        iconUrl: 'https://s3-us-west-2.amazonaws.com/examples-exp/floaty_icon.png',
      },
    },
    {
      url: 'exp://exp.host/@community/growler-prowler',
      manifest: {
        name: 'Growler Prowler',
        desc: 'Browse craft beer in Vancouver',
        iconUrl: 'https://s3.amazonaws.com/exp-brand-assets/ExponentEmptyManifest_192.png',
      },
    },
  ];
}

module.exports = {
  setReferrer,
  getFeatured,
};
