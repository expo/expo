/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule SwipeableQuickActionButton
 * @flow
 */
'use strict';

const Image = require('../../Image/Image');
const PropTypes = require('prop-types');
const React = require('react');
const Text = require('../../Text/Text');
const TouchableHighlight = require('../../Components/Touchable/TouchableHighlight');
const View = require('../../Components/View/View');
const ViewPropTypes = require('../../Components/View/ViewPropTypes');

import type {ImageSource} from '../../Image/ImageSource';

/**
 * Standard set of quick action buttons that can, if the user chooses, be used
 * with SwipeableListView. Each button takes an image and text with optional
 * formatting.
 */
class SwipeableQuickActionButton extends React.Component<{
  accessibilityLabel?: string,
  imageSource: ImageSource | number,
  imageStyle?: ?ViewPropTypes.style,
  onPress?: Function,
  style?: ?ViewPropTypes.style,
  testID?: string,
  text?: ?(string | Object | Array<string | Object>),
  textStyle?: ?ViewPropTypes.style,
}> {
  static propTypes = {
    accessibilityLabel: PropTypes.string,
    imageSource: Image.propTypes.source.isRequired,
    imageStyle: Image.propTypes.style,
    onPress: PropTypes.func,
    style: ViewPropTypes.style,
    testID: PropTypes.string,
    text: PropTypes.string,
    textStyle: Text.propTypes.style,
  };

  render(): React.Node {
    if (!this.props.imageSource && !this.props.text) {
      return null;
    }

    return (
      <TouchableHighlight
        onPress={this.props.onPress}
        testID={this.props.testID}
        underlayColor="transparent">
        <View style={this.props.style}>
          <Image
            accessibilityLabel={this.props.accessibilityLabel}
            source={this.props.imageSource}
            style={this.props.imageStyle}
          />
          <Text style={this.props.textStyle}>
            {this.props.text}
          </Text>
        </View>
      </TouchableHighlight>
    );
  }
}

module.exports = SwipeableQuickActionButton;
