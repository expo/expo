/**
 * @flow
 */

import React from 'react';
import {
  Clipboard,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { createFocusAwareComponent } from '@expo/ex-navigation';
import { Constants } from 'expo';
import { connect } from 'react-redux';

import Alerts from '../constants/Alerts';
import BrowserActions from 'BrowserActions';
import Colors from '../constants/Colors';
import DevIndicator from '../components/DevIndicator';
import SharedStyles from '../constants/SharedStyles';
import SmallProjectCard from '../components/SmallProjectCard';
import ProjectTools from '../components/ProjectTools';

@createFocusAwareComponent
@connect(data => HomeScreen.getDataProps(data))
export default class HomeScreen extends React.Component {
  props: {
    isFocused: boolean,
    dispatch: () => void,
    recentHistory: any,
    allHistory: any,
    navigator: any,
  };

  static route = {
    navigationBar: {
      title: 'Projects',
    },
  };

  static getDataProps(data) {
    let { history } = data.browser;

    return {
      recentHistory: history.take(6),
      allHistory: history,
    };
  }

  render() {
    return (
      <View style={styles.container}>
        <ScrollView
          key={
            /* note(brent): sticky headers break re-rendering scrollview */
            /* contents on sdk17, remove this in sdk18 */
            Platform.OS === 'ios'
              ? this.props.allHistory.count()
              : 'scroll-view'
          }
          stickyHeaderIndices={Platform.OS === 'ios' ? [0, 2] : []}
          style={styles.container}
          contentContainerStyle={styles.contentContainer}>

          <View style={SharedStyles.sectionLabelContainer}>
            <Text style={SharedStyles.sectionLabelText}>TOOLS</Text>
          </View>
          {this._renderProjectTools()}

          <View style={SharedStyles.sectionLabelContainer}>
            <Text style={SharedStyles.sectionLabelText}>RECENTLY VISITED</Text>
            <TouchableOpacity
              onPress={this._handlePressClearHistory}
              style={styles.clearButton}>
              <Text style={styles.clearButtonText}>CLEAR</Text>
            </TouchableOpacity>
          </View>

          {this._renderRecentHistory()}
          {this._renderExpoVersion()}
        </ScrollView>

        <StatusBar barStyle="default" />
      </View>
    );
  }

  _handlePressClearHistory = () => {
    this.props.dispatch(BrowserActions.clearHistoryAsync());
  };

  _renderProjectTools = () => {
    return <ProjectTools pollForUpdates={this.props.isFocused} />;
  };

  _renderRecentHistory = () => {
    return this.props.allHistory.count() === 0
      ? this._renderEmptyRecentHistory()
      : this._renderRecentHistoryItems();
  };

  _renderEmptyRecentHistory = () => {
    return (
      <View style={SharedStyles.genericCardContainer} key="empty-history">
        <View style={SharedStyles.genericCardBody}>
          <Text style={[SharedStyles.faintText, { textAlign: 'center' }]}>
            You haven't opened any projects recently.
          </Text>
        </View>
      </View>
    );
  };

  _renderRecentHistoryItems = () => {
    const extractUsername = manifestUrl => {
      let username = manifestUrl.match(/@.*?\//)[0];
      if (!username) {
        return null;
      } else {
        return username.slice(0, username.length - 1);
      }
    };

    return this.props.recentHistory.map((project, i) => (
      <SmallProjectCard
        key={project.manifestUrl}
        iconUrl={project.manifest.iconUrl}
        projectName={project.manifest.name}
        username={
          project.manifestUrl.includes('exp://exp.host')
            ? extractUsername(project.manifestUrl)
            : null
        }
        projectUrl={project.manifestUrl}
        fullWidthBorder={i === this.props.recentHistory.count() - 1}
      />
    ));
  };

  _renderExpoVersion = () => {
    return (
      <View style={styles.expoVersionContainer}>
        <Text
          style={styles.expoVersionText}
          onPress={this._copyClientVersionToClipboard}>
          Client version: {Constants.expoVersion}
        </Text>
      </View>
    );
  };

  _copyClientVersionToClipboard = () => {
    Clipboard.setString(Constants.expoVersion);
    this.props.navigator.showLocalAlert(
      'The client version has been copied to your clipboard',
      Alerts.notice
    );
  };

  _renderInDevelopment = () => {
    // Nothing here for now
    return null;

    return (
      <View style={{ marginBottom: 10 }}>
        <View style={SharedStyles.sectionLabelContainer}>
          <DevIndicator style={{ marginRight: 7 }} />
          <Text style={SharedStyles.sectionLabelText}>IN DEVELOPMENT</Text>
        </View>

        <SmallProjectCard
          iconUrl="https://s3.amazonaws.com/exp-brand-assets/ExponentEmptyManifest_192.png"
          projectName="Tab bar experiment"
          projectUrl="exp://m2-6dz.community.exponent-home.exp.direct"
          fullWidthBorder
        />
      </View>
    );
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.greyBackground,
  },
  contentContainer: {
    paddingTop: 5,
  },
  clearButton: {
    position: 'absolute',
    right: Platform.OS === 'android' ? 15 : 0,
    top: Platform.OS === 'android' ? 12 : 0,
  },
  clearButtonText: {
    color: Colors.greyText,
    fontSize: 11,
    letterSpacing: 0.92,
    ...Platform.select({
      ios: {
        fontWeight: '500',
      },
    }),
  },
  expoVersionContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
    justifyContent: 'flex-end',
    alignItems: 'center',
    flex: 1,
  },
  expoVersionText: {
    color: 'rgba(0,0,0,0.1)',
    fontSize: 11,
  },
});
