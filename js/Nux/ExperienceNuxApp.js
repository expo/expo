/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule ExperienceNuxApp
 */
'use strict';

import React from 'react';

import NuxContextualMenuOverlay from 'NuxContextualMenuOverlay';

export default class ExperienceNuxApp extends React.Component {
  render() {
    return (
      <NuxContextualMenuOverlay />
    );
  }
}
