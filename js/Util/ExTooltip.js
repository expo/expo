/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule ExTooltip
 */
'use strict';

import React, { PropTypes } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';

import autobind from 'autobind-decorator';

import ExColors from 'ExColors';

let deviceHeight = Dimensions.get('window').height;
let deviceWidth = Dimensions.get('window').width;

const ARROW_WIDTH = 27;
const ARROW_HEIGHT = 18;

export default class ExTooltip extends React.Component {
  static propTypes = {
    tooltipPoint: PropTypes.object.isRequired,
    tooltipTitle: PropTypes.string,
    tooltipDescription: PropTypes.string,
    tooltipAction: PropTypes.string,
    tooltipActionIsSmall: PropTypes.bool,
    tooltipActionTestID: PropTypes.string,
    onPressAction: PropTypes.func,
    renderAccessories: PropTypes.func,
    shouldFadeIn: PropTypes.bool,
  };

  constructor(props, context) {
    super(props, context);

    this.state = {
      overlayOpacity: new Animated.Value(props.shouldFadeIn ? 0 : 1),
    };
  }

  componentDidMount() {
    if (this.props.shouldFadeIn) {
      Animated.timing(this.state.overlayOpacity, {
        easing: Easing.inOut(Easing.quad),
        toValue: 1,
        duration: 400,
      }).start();
    }
  }

  render() {
    let renderAccessories = () => {
      if (this.props.renderAccessories) {
        return this.props.renderAccessories();
      } else {
        return null;
      }
    };

    // start at 0.001 so that the user can't scroll
    let backgroundColor = this.state.overlayOpacity.interpolate({
      inputRange: [0, 1],
      outputRange: ['rgba(0, 0, 0, 0.001)', 'rgba(0, 0, 0, 0.8)'],
    });

    return (
      <Animated.View style={[styles.overlay, {
        backgroundColor,
      }]}>
        {renderAccessories()}
        {this._renderTooltip()}
      </Animated.View>
    );
  }

  @autobind
  _renderTooltip() {
    let containerY = this.props.tooltipPoint.y;
    let arrowLeft = this.props.tooltipPoint.x - (ARROW_WIDTH * 0.5);

    // TODO: move `opacity: this.state.overlayOpacity` into top level view.
    // wasn't working when i tried. maybe RN bug?
    return (
      <View style={[styles.tooltipContainer, {
        top: containerY,
      }]}>
        <Animated.View style={[styles.tooltipBody, {
          opacity: this.state.overlayOpacity,
        }]}>
          <Text style={styles.title}>{this.props.tooltipTitle}</Text>
          {this._renderDescription()}
          {this._renderAction()}
        </Animated.View>
        <Animated.Image
          source={{uri: 'https://d3lwq5rlu14cro.cloudfront.net/tooltip_arrow.png'}}
          tintColor={ExColors.exponentBlue}
          style={[styles.arrow, {
            left: arrowLeft,
            opacity: this.state.overlayOpacity,
          }]}
        />
      </View>
    );
  }

  @autobind
  _renderDescription() {
    if (!this.props.tooltipDescription) {
      return null;
    }
    return (
      <Text style={styles.description}>{this.props.tooltipDescription}</Text>
    );
  }

  @autobind
  _renderAction() {
    if (!this.props.tooltipAction) {
      return null;
    }

    let buttonStyle = (this.props.tooltipActionIsSmall) ? styles.actionButtonSmall : styles.actionButton;
    let labelStyle = (this.props.tooltipActionIsSmall) ? styles.actionLabelSmall : styles.actionLabel;

    return (
      <TouchableOpacity
        testID={this.props.tooltipActionTestID}
        style={buttonStyle}
        onPress={this.props.onPressAction}>
        <Text style={labelStyle}>
          {this.props.tooltipAction}
        </Text>
      </TouchableOpacity>
    );
  }
}

let styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    width: deviceWidth,
    height: deviceHeight,
  },
  arrow: {
    position: 'absolute',
    top: 0,
    width: ARROW_WIDTH,
    height: ARROW_HEIGHT,
    resizeMode: 'contain',
  },
  tooltipContainer: {
    position: 'absolute',
    width: deviceWidth,
    left: 0,
  },
  tooltipBody: {
    position: 'absolute',
    top: ARROW_HEIGHT - 1,
    padding: 14,
    backgroundColor: ExColors.exponentBlue,
    borderWidth: 1,
    borderColor: ExColors.exponentBlue,
    left: deviceWidth * 0.05,
    right: deviceWidth * 0.05,
    borderRadius: 2,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '200',
    marginBottom: 6,
  },
  description: {
    color: 'white',
    fontSize: 14,
    fontWeight: '100',
  },
  actionButton: {
    backgroundColor: '#133857',
    padding: 12,
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    color: 'white',
  },
  actionButtonSmall: {
    paddingHorizontal: 12,
    paddingTop: 16,
    marginTop: 6,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  actionLabelSmall: {
    color: '#8da5ba',
  },
});
