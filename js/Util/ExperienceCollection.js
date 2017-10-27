/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule ExperienceCollection
 * @flow
 */

import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, View, Text, Image } from 'react-native';
import TouchableNativeFeedbackSafe from '@expo/react-native-touchable-native-feedback-safe';

const ICON_LIST_SIZE = 55;
const EXPERIENCE_MAX_TITLE_LENGTH_FULL_WIDTH = 32;

export default class ExperienceCollection extends React.Component {
  static NUM_TRUNCATED_EXPERIENCES = 3;

  static propTypes = {
    experiences: PropTypes.array,
    headingLabel: PropTypes.string,
    actionLabel: PropTypes.string,
    onPressHeading: PropTypes.func,
    onPressItem: PropTypes.func,
    firstExperienceRef: PropTypes.func,
    headingStyle: PropTypes.any,
  };

  render() {
    let actionLabel;

    if (this.props.actionLabel) {
      actionLabel = <Text style={styles.headingDisclosure}>{this.props.actionLabel}</Text>;
    }

    return (
      <View style={styles.container}>
        <TouchableNativeFeedbackSafe
          onPress={this._onPressHeading}
          style={[styles.heading, this.props.headingStyle]}>
          <Text style={styles.headingText}>{this.props.headingLabel}</Text>
          {actionLabel}
        </TouchableNativeFeedbackSafe>

        <View style={styles.experiencesContainer}>
          {this._renderExperiences(this.props.experiences)}
        </View>
      </View>
    );
  }

  _renderExperiences(experiences: Array<any>) {
    return experiences.map((experience, index) => {
      let isFirst = index === 0;
      let ref = isFirst && this.props.firstExperienceRef ? this.props.firstExperienceRef : null;
      let truncatedName = experience.manifest.name;
      if (truncatedName.length > EXPERIENCE_MAX_TITLE_LENGTH_FULL_WIDTH) {
        truncatedName = `${truncatedName.substring(
          0,
          EXPERIENCE_MAX_TITLE_LENGTH_FULL_WIDTH - 3
        )}...`;
      }

      if (this.props.headingLabel === 'Featured') {
        return this._renderFeaturedExperience(experience, ref, truncatedName, isFirst);
      } else {
        return this._renderRecentExperience(experience, ref, truncatedName, isFirst);
      }
    });
  }

  _renderRecentExperience(experience: Object, ref: any, title: string, isFirst: boolean) {
    let url = experience.url || '';
    url = url.replace(/^\w+:\/\//, '');

    return (
      <TouchableNativeFeedbackSafe
        key={experience.url}
        background={TouchableNativeFeedbackSafe.Ripple('#e3e3e3', false)}
        onPress={() => this._onPressItem(experience)}
        style={[styles.experienceFullWidthContainer, isFirst ? { paddingTop: 15 } : {}]}>
        <View style={[styles.experienceIconContainer, styles.fullWidthIconContainer]}>
          <Image
            ref={ref}
            source={{ uri: experience.manifest.iconUrl }}
            style={styles.fullWidthIcon}
          />
        </View>

        <View style={styles.fullWidthMeta}>
          <Text style={styles.fullWidthTitle}>{title}</Text>
          <Text style={styles.fullWidthUrl}>{url}</Text>
        </View>
      </TouchableNativeFeedbackSafe>
    );
  }

  _renderFeaturedExperience(experience: Object, ref: any, title: string, isFirst: boolean) {
    return (
      <TouchableNativeFeedbackSafe
        key={experience.url}
        background={TouchableNativeFeedbackSafe.Ripple('#e3e3e3', false)}
        onPress={() => this._onPressItem(experience)}
        style={[styles.experienceFullWidthContainer, isFirst ? { paddingTop: 15 } : {}]}>
        <View style={[styles.experienceIconContainer, styles.fullWidthIconContainer]}>
          <Image
            ref={ref}
            source={{ uri: experience.manifest.iconUrl }}
            style={styles.fullWidthIcon}
          />
        </View>

        <View style={styles.fullWidthMeta}>
          <Text style={styles.fullWidthTitle}>{title}</Text>
          <Text style={styles.fullWidthDescription}>{experience.manifest.desc}</Text>
        </View>
      </TouchableNativeFeedbackSafe>
    );
  }

  _onPressHeading = () => {
    if (this.props.onPressHeading) {
      this.props.onPressHeading();
    }
  };

  _onPressItem = (experience: Object) => {
    if (this.props.onPressItem) {
      this.props.onPressItem(experience);
    }
  };
}

let styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,0.011)',
  },
  heading: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.07)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.02)',
    paddingVertical: 10,
  },
  headingText: {
    color: '#444444',
    fontSize: 17,
    fontWeight: '200',
    marginLeft: 15,
    flex: 7,
  },
  headingDisclosure: {
    color: '#999999',
    fontSize: 16,
    fontWeight: '100',
    marginRight: 10,
    flex: 1,
  },
  experiencesContainer: {
    flexWrap: 'wrap',
    // TODO
    // paddingBottom: 10,
  },
  experienceIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  experienceName: {
    color: '#666666',
    marginVertical: 4,
    fontSize: 12,
  },
  experienceFullWidthContainer: {
    alignItems: 'flex-start',
    paddingBottom: 14,
    paddingHorizontal: 20,
    paddingTop: 10,
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  fullWidthIconContainer: {
    paddingRight: 20,
    width: ICON_LIST_SIZE + 20,
    height: ICON_LIST_SIZE,
    alignItems: 'flex-start',
  },
  fullWidthIcon: {
    width: ICON_LIST_SIZE,
    height: ICON_LIST_SIZE,
  },
  fullWidthMeta: {
    alignItems: 'flex-start',
    flex: 1,
    paddingVertical: 2,
    paddingRight: 2,
  },
  fullWidthTitle: {
    color: '#333',
    fontSize: 17,
    fontWeight: '200',
  },
  fullWidthUrl: {
    marginTop: 2,
    fontSize: 13,
    color: '#C6C4C4',
  },
  fullWidthDescription: {
    marginTop: 2,
    fontSize: 13,
    color: '#666',
  },
});
