/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule InfoScreenApp
 */
'use strict';

import React, { PropTypes } from 'react';
import {
  BackAndroid,
  Image,
  NativeModules,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

let {
 ExponentConstants,
 ExponentKernel,
} = NativeModules;

import autobind from 'autobind-decorator';

import ExColors from 'ExColors';

const ICON_SIZE = 36;

export default class InfoScreenApp extends React.Component {
  static propTypes = {
    exp: PropTypes.object,
  };

  constructor(props, context) {
    super(props, context);

    this.state = {
      isManifestVisible: false,
    };
  }

  render() {
    if (!this.props.exp || !this.props.exp.manifest || !this.props.exp.manifestUrl) {
      return (
        <View style={styles.container}>
          <Text style={styles.bigText}>
            No infomation found for this experience.
          </Text>
        </View>
      );
    }

    let manifest = this.props.exp.manifest;
    return (
      <View style={styles.container}>
        {this._renderNav()}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}>

          <View style={{flexDirection: 'row', alignItems: 'center', paddingBottom: 20}}>
            <Image source={{uri: manifest.iconUrl}} style={styles.experienceIcon} />
            <Text style={[styles.bigText, {paddingLeft: 20}]}>
              {manifest.name}
            </Text>
          </View>

          <Text style={styles.mediumText}>
            SDK Version: {manifest.sdkVersion}
          </Text>
          <Text style={styles.mediumText}>
            ID: {manifest.id}
          </Text>
          <Text style={styles.mediumText}>
            Published Time: {manifest.publishedTime}
          </Text>
          <Text style={styles.mediumText}>
            Is Verified: {manifest.isVerified.toString()}
          </Text>

          <View style={{marginVertical: 30, flexDirection: 'row'}}>
            {this._renderButton('Clear Data', this._clearData)}
            {this._renderButton((this.state.isManifestVisible ? 'Hide' : 'View') +
              ' Manifest', this._viewManifest)}
          </View>

          {
            this.state.isManifestVisible ?
              <View>
                <Text style={[styles.mediumText, {marginTop: 0}]}>
                  Manifest:
                </Text>
                <Text style={styles.smallText}>
                  {JSON.stringify(manifest)}
                </Text>
              </View> :
              <View />
        }
        </ScrollView>
      </View>
    );
  }

  _renderNav() {
    return (
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => BackAndroid.exitApp()}>
          <Image source={{uri: 'ic_arrow_back_white_36dp'}} style={styles.icon} />
        </TouchableOpacity>
        <Text style={{marginLeft: 14, color: 'white', fontSize: 20}}>
          Info
        </Text>
      </View>
    );
  }

  _renderButton(text, onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={{
          paddingVertical: 10,
          paddingHorizontal: 30,
          marginRight: 10,
          borderRadius: 3,
          borderWidth: 0.5,
          borderColor: ExColors.buttonBorder,
          overflow: 'hidden',
          backgroundColor: ExColors.buttonBackground,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text style={{
          color: ExColors.text,
          fontSize: 16,
        }}>
          {text}
        </Text>
      </TouchableOpacity>
    );
  }

  @autobind
  _clearData() {
    ExponentKernel.clearExperienceData(this.props.exp.manifest.id, this.props.exp.manifestUrl);
  }

  @autobind
  _viewManifest() {
    this.setState(state => {
      return {
        isManifestVisible: !state.isManifestVisible,
      };
    });
  }
}

// Tell Java that it can send us DeviceEventEmitter events now.
ExponentKernel.onLoaded();

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ExColors.background,
  },
  scrollView: {
    flex: 1,
  },
  experienceIcon: {
    overflow: 'hidden',
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  contentContainer: {
    padding: 20,
  },
  bigText: {
    color: ExColors.text,
    fontSize: 22,
    textAlign: 'center',
  },
  mediumText: {
    color: ExColors.text,
    fontSize: 16,
  },
  smallText: {
    color: ExColors.text,
    fontSize: 12,
  },
  navBar: {
    paddingTop: ExponentConstants.statusBarHeight,
    paddingHorizontal: 10,
    flexDirection: 'row',
    height: 80,
    backgroundColor: ExColors.navy,
    alignItems: 'center',
  },
  icon: {
    width: 24,
    height: 24,
  },
});
