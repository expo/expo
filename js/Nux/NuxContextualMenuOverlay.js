/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule NuxContextualMenuOverlay
 */
'use strict';

import React from 'react';
import { NativeModules } from 'react-native';

const { ExponentConstants } = NativeModules;

import autobind from 'autobind-decorator';

import ExTooltip from 'ExTooltip';
import ExponentKernel from 'ExponentKernel';

export default class NuxContextualMenuOverlay extends React.Component {
  render() {
    return (
      <ExTooltip
        tooltipTitle="Pull down to show the Exponent menu."
        tooltipDescription="This allows you to pin the app to your home screen."
        tooltipAction="No thanks"
        tooltipActionIsSmall
        tooltipActionTestID="nux_no_thanks"
        tooltipPoint={{ x: 48, y: 28 + ExponentConstants.statusBarHeight }}
        onPressAction={this._onPressAction}
        renderAccessories={this._renderExperienceIconAccessory}
      />
    );
  }

  @autobind _onPressAction() {
    ExponentKernel.dismissNuxAsync();
  }
}
