/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const AnimatedImplementation = require('./AnimatedImplementation');
const FlatList = require('../../Lists/FlatList');
const Image = require('../../Image/Image');
const ScrollView = require('../../Components/ScrollView/ScrollView');
const SectionList = require('../../Lists/SectionList');
const Text = require('../../Text/Text');
const View = require('../../Components/View/View');

module.exports = {
  ...AnimatedImplementation,
  View: AnimatedImplementation.createAnimatedComponent(View),
  Text: AnimatedImplementation.createAnimatedComponent(Text),
  Image: AnimatedImplementation.createAnimatedComponent(Image),
  ScrollView: AnimatedImplementation.createAnimatedComponent(ScrollView),
  FlatList: AnimatedImplementation.createAnimatedComponent(FlatList),
  SectionList: AnimatedImplementation.createAnimatedComponent(SectionList),
};
