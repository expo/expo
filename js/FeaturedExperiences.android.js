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

  let featuredExperiences = [];

  return featuredExperiences;
}

module.exports = {
  setReferrer,
  getFeatured,
};
