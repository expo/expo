/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule FeaturedExperiences
 */
'use strict';

let referrer = null;
let hasSetReferrer = false;

function setReferrer(newReferrer) {
  referrer = newReferrer;
  hasSetReferrer = true;
}

function getFeatured() {
  if (!hasSetReferrer) {
    return [];
  }

  let featuredExperiences = [
    {
      nux: true,
      url: 'exp://exp.host/@listapp/listapp',
      manifest: {
        name: 'li.st',
        desc: 'Create and share lists about anything and everything.',
        iconUrl: 'https://d3fzfeknznuaac.cloudfront.net/images5/androidicon.png',
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
      url: 'exp://exp.host/@exponent/pomodoro',
      manifest: {
        name: 'Pomodoro',
        desc: 'Be careful or the tomatoes might explode!',
        iconUrl: 'https://s3.amazonaws.com/pomodoro-exp/icon.png',
      },
    },
    {
      nux: false,
      url: 'exp://exp.host/@notbrent/native-component-list',
      manifest: {
        name: 'Native Component List',
        desc: 'Try some of the components built into Exponent',
        iconUrl: 'https://s3.amazonaws.com/exp-brand-assets/ExponentEmptyManifest_192.png',
      },
    },
  ];

  return featuredExperiences;
}

module.exports = {
  setReferrer,
  getFeatured,
};
