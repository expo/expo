/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule NuxFirstExperienceOverlay
 */
'use strict';

import React, { PropTypes } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import autobind from 'autobind-decorator';
import filter from 'lodash/filter';

import ExTooltip from 'ExTooltip';
import FeaturedExperiences from 'FeaturedExperiences';

const ICON_SIZE = 96;

export default class NuxFirstExperienceOverlay extends React.Component {
  static propTypes = {
    firstExperienceFrame: PropTypes.object,
    onPressExperience: PropTypes.func,
    referrer: PropTypes.string,
  };

  render() {
    if (!this.props.firstExperienceFrame) {
      return null;
    }
    let tooltipPoint = {
      x: this.props.firstExperienceFrame.x + (this.props.firstExperienceFrame.width * 0.5),
      y: this.props.firstExperienceFrame.y + this.props.firstExperienceFrame.height + 10,
    };
    return (
      <ExTooltip
        tooltipTitle="Hello!"
        tooltipDescription="Tap an icon to open an app."
        tooltipPoint={tooltipPoint}
        renderAccessories={this._renderFeaturedRow}
        shouldFadeIn
      />
    );
  }

  @autobind
  _renderFeaturedRow() {
    let experiences = filter(FeaturedExperiences.getFeatured(), exp => exp.nux);
    experiences[0].isFirst = true;

    return (
      <View style={[
          styles.experiencesContainer,
          { top: this.props.firstExperienceFrame.y },
        ]}>
        {experiences.map(experience => this._renderFlexExperience(experience))}
      </View>
    );
  }

  _renderFlexExperience(experience) {
    return (
      <TouchableOpacity
        testID={experience.isFirst ? 'first_nux_experience' : 'other_nux_experience'}
        key={experience.url}
        onPress={() => this._onPressItem(experience)}
        style={styles.experienceContainer}>
        <View
          style={styles.experienceIconContainer}>
          <Image
            source={{uri: experience.manifest.iconUrl}}
            style={styles.experienceIcon}
          />
        </View>
        <Text style={styles.experienceName}>{experience.manifest.name}</Text>
      </TouchableOpacity>
    );
  }

  @autobind
  _onPressItem(experience) {
    if (this.props.onPressExperience) {
      this.props.onPressExperience(experience);
    }
  }
}

let styles = StyleSheet.create({
  experiencesContainer: {
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingTop: 16,
    flexDirection: 'row',
  },
  experienceContainer: {
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  experienceIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  experienceName: {
    color: 'white',
    marginVertical: 4,
    fontSize: 12,
  },
  experienceIcon: {
    overflow: 'hidden',
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
});
