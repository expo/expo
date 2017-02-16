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
import { Constants } from 'exponent';
import { connect } from 'react-redux';
import { take, takeRight } from 'lodash';

import Alerts from '../constants/Alerts';
import AddProjectButton from '../components/AddProjectButton';
import BrowserActions from 'BrowserActions';
import Colors from '../constants/Colors';
import EmptyProjectsNotice from '../components/EmptyProjectsNotice';
import SharedStyles from '../constants/SharedStyles';
import SeeAllProjectsButton from '../components/SeeAllProjectsButton';
import SmallProjectCard from '../components/SmallProjectCard';

@connect(data => HomeScreen.getDataProps(data))
export default class HomeScreen extends React.Component {
  static route = {
    navigationBar: {
      title: 'Projects',
      renderRight: () => <AddProjectButton />,
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
    if (this.props.allHistory.count() === 0) {
      return <EmptyProjectsNotice />;
    }

    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}>

          {this._renderInDevelopment()}

          <View style={SharedStyles.sectionLabelContainer}>
            <Text style={SharedStyles.sectionLabelText}>RECENTLY VISITED</Text>
            <TouchableOpacity
              onPress={this._handlePressClearHistory}
              style={styles.clearButton}>
              <Text style={styles.clearButtonText}>CLEAR</Text>
            </TouchableOpacity>
          </View>

          {this._renderRecentHistory()}

          {/* <SeeAllProjectsButton onPress={() => {}} projects={FakeProjects} /> */
          }

          {this._renderExponentVersion()}
        </ScrollView>

        <StatusBar barStyle="default" />
      </View>
    );
  }

  _renderExponentVersion = () => {
    return (
      <View style={styles.exponentVersionContainer}>
        <Text
          style={styles.exponentVersionText}
          onPress={this._copyClientVersionToClipboard}>
          Client version: {Constants.exponentVersion}
        </Text>
      </View>
    );
  };

  _copyClientVersionToClipboard = () => {
    Clipboard.setString(Constants.exponentVersion);
    this.props.navigator.showLocalAlert(
      'The client version has been copied to your clipboard',
      Alerts.notice,
    );
  };

  _renderInDevelopment = () => {
    // Nothing here for now
    return null;

    return (
      <View style={{ marginBottom: 10 }}>
        <View style={SharedStyles.sectionLabelContainer}>
          <View style={styles.greenDot} />
          <Text style={SharedStyles.sectionLabelText}>IN DEVELOPMENT</Text>
        </View>

        <SmallProjectCard
          iconUrl="https://s3.amazonaws.com/exp-brand-assets/ExponentEmptyManifest_192.png"
          projectName="Tab bar experiment"
          projectUrl="exp://m2-6dz.community.exponent-home.exp.direct:80"
          fullWidthBorder
        />
      </View>
    );
  };

  _handlePressClearHistory = () => {
    this.props.dispatch(BrowserActions.clearHistoryAsync());
  };

  _renderRecentHistory = () => {
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.greyBackground,
  },
  contentContainer: {
    paddingTop: 10,
  },
  clearButton: {
    position: 'absolute',
    right: 15,
    top: 10,
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
  greenDot: {
    backgroundColor: '#28ba20',
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 7,
  },
  exponentVersionContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
    justifyContent: 'flex-end',
    alignItems: 'center',
    flex: 1,
  },
  exponentVersionText: {
    color: 'rgba(0,0,0,0.1)',
    fontSize: 11,
  },
});
