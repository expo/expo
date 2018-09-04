/**
 * @flow
 */

import React from 'react';
import {
  AppState,
  Alert,
  Clipboard,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { withNavigationFocus, withNavigation } from 'react-navigation';
import { Constants } from 'expo';
import { connect } from 'react-redux';
import _ from 'lodash';

import addListenerWithNativeCallback from '../utils/addListenerWithNativeCallback';
import Alerts from '../constants/Alerts';
import Colors from '../constants/Colors';
import DevIndicator from '../components/DevIndicator';
import HistoryActions from '../redux/HistoryActions';
import OpenProjectByURLButton from '../components/OpenProjectByURLButton';
import NoProjectTools from '../components/NoProjectTools';
import NoProjectsOpen from '../components/NoProjectsOpen';
import ProjectTools from '../components/ProjectTools';
import SharedStyles from '../constants/SharedStyles';
import SmallProjectCard from '../components/SmallProjectCard';
import Store from '../redux/Store';
import Connectivity from '../api/Connectivity';
import getSnackId from '../utils/getSnackId';
import { isAuthenticated, authenticatedFetch } from '../api/helpers';

import extractReleaseChannel from '../utils/extractReleaseChannel';

const IS_RESTRICTED = Constants.isDevice && Platform.OS === 'ios';
const PROJECT_UPDATE_INTERVAL = 10000;
const USE_STAGING = false;

@withNavigationFocus
@withNavigation
@connect(data => ProjectsScreen.getDataProps(data))
export default class ProjectsScreen extends React.Component {
  props: {
    navigation: any,
    isFocused: boolean,
    dispatch: () => void,
    recentHistory: any,
    allHistory: any,
    navigator: any,
    isAuthenticated: boolean,
  };

  static navigationOptions = {
    title: 'Projects',
    ...Platform.select({
      ios: {
        headerRight: Constants.isDevice ? null : <OpenProjectByURLButton />,
      },
    }),
  };

  static getDataProps(data) {
    let { history } = data.history;

    return {
      recentHistory: history.take(10),
      allHistory: history,
      isAuthenticated: data.session && data.session.sessionSecret,
    };
  }

  state = {
    projects: [],
    isNetworkAvailable: Connectivity.isAvailable(),
    isRefreshing: false,
  };

  componentDidMount() {
    AppState.addEventListener('change', this._maybeResumePollingFromAppState);
    Connectivity.addListener(this._updateConnectivity);
    this._startPollingForProjects();

    addListenerWithNativeCallback('ExponentKernel.showQRReader', async event => {
      this.props.navigation.showModal('QRCode');
      return { success: true };
    });

    addListenerWithNativeCallback('ExponentKernel.addHistoryItem', async event => {
      let { manifestUrl, manifest, manifestString } = event;
      if (!manifest && manifestString) {
        manifest = JSON.parse(manifestString);
      }
      Store.dispatch(HistoryActions.addHistoryItem(manifestUrl, manifest));
    });
  }

  componentWillUnmount() {
    this._stopPollingForProjects();
    AppState.removeEventListener('change', this._maybeResumePollingFromAppState);
    Connectivity.removeListener(this._updateConnectivity);
  }

  render() {
    const { projects } = this.state;

    return (
      <View style={styles.container}>
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={this.state.isRefreshing}
              onRefresh={this._handleRefreshAsync}
            />
          }
          key={
            /* note(brent): sticky headers break re-rendering scrollview */
            /* contents on sdk17, remove this in sdk18 */
            Platform.OS === 'ios' ? this.props.allHistory.count() : 'scroll-view'
          }
          stickyHeaderIndices={Platform.OS === 'ios' ? [0, 2, 4] : []}
          style={styles.container}
          contentContainerStyle={styles.contentContainer}>
          <View style={SharedStyles.sectionLabelContainer}>
            <Text style={SharedStyles.sectionLabelText}>
              {IS_RESTRICTED || Platform.OS === 'android' ? 'TOOLS' : 'CLIPBOARD'}
            </Text>
          </View>
          {this._renderProjectTools()}

          <View style={SharedStyles.sectionLabelContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <DevIndicator
                style={{ marginRight: 7 }}
                isActive={projects && projects.length}
                isNetworkAvailable={this.state.isNetworkAvailable}
              />
              <Text style={SharedStyles.sectionLabelText}>RECENTLY IN DEVELOPMENT</Text>
            </View>
            <TouchableOpacity onPress={this._handlePressHelpProjects} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>HELP</Text>
            </TouchableOpacity>
          </View>
          {this._renderProjects()}

          <View style={SharedStyles.sectionLabelContainer}>
            <Text style={SharedStyles.sectionLabelText}>RECENTLY OPENED</Text>
            <TouchableOpacity onPress={this._handlePressClearHistory} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>CLEAR</Text>
            </TouchableOpacity>
          </View>

          {this._renderRecentHistory()}
          {this._renderConstants()}
        </ScrollView>

        <StatusBar barStyle="default" />
      </View>
    );
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.isFocused && this.props.isFocused) {
      this._fetchProjectsAsync();
    }

    if (prevProps.isAuthenticated && !this.props.isAuthenticated) {
      // Remove all projects except Snack, because they are tied to device id
      this.setState(({ projects }) => ({
        projects: projects.filter(p => p.source === 'snack'),
      }));
    }
  }

  _updateConnectivity = (isAvailable: boolean): void => {
    if (isAvailable !== this.state.isNetworkAvailable) {
      this.setState({ isNetworkAvailable: isAvailable });
    }
  };

  _maybeResumePollingFromAppState = (nextAppState: string): void => {
    if (nextAppState === 'active' && !this._projectPolling) {
      this._startPollingForProjects();
    } else {
      this._stopPollingForProjects();
    }
  };

  _startPollingForProjects = async () => {
    this._handleRefreshAsync();
    this._projectPolling = setInterval(this._fetchProjectsAsync, PROJECT_UPDATE_INTERVAL);
  };

  _stopPollingForProjects = async () => {
    clearInterval(this._projectPolling);
    this._projectPolling = null;
  };

  _fetchProjectsAsync = async () => {
    try {
      let BASE_URL = USE_STAGING ? 'https://staging.expo.io' : 'https://exp.host';
      let fetchStrategy = isAuthenticated() ? authenticatedFetch : fetch;
      let response = await fetchStrategy(
        `${BASE_URL}/--/api/v2/development-sessions?deviceId=${getSnackId()}`
      );
      let result = await response.json();
      let rawProjects = (result.data || []).reverse();
      let projects = _.uniqBy(rawProjects, p => p.url);
      this.setState({ projects });
    } catch (e) {
      // this doesn't really matter, we will try again later
      if (__DEV__) {
        console.log(e);
      }
    }
  };

  _handleRefreshAsync = async () => {
    this.setState({ isRefreshing: true });

    try {
      await Promise.all([
        this._fetchProjectsAsync(),
        new Promise(resolve => setTimeout(resolve, 1000)),
      ]);
    } catch (e) {
      // not sure what to do here, maybe nothing?
    } finally {
      this.setState({ isRefreshing: false });
    }
  };

  _handlePressHelpProjects = () => {
    if (!this.state.isNetworkAvailable) {
      Alert.alert(
        'No network connection available',
        `You must be connected to the internet to view a list of your projects open in development.`
      );
    }

    let baseMessage = `Make sure you are signed in to the same Expo account on your computer and this app. Also verify that your computer is connected to the internet, and ideally to the same WiFi network as your mobile device. Lastly, ensure that you are using the latest version of exp or XDE. Pull to refresh to update.`;
    let message = Platform.select({
      ios: Constants.isDevice
        ? baseMessage
        : `${baseMessage} If this still doesn't work, press the + icon on the header to type the project URL manually.`,
      android: baseMessage,
    });
    Alert.alert('Troubleshooting', message);
  };

  _handlePressClearHistory = () => {
    this.props.dispatch(HistoryActions.clearHistory());
  };

  _renderProjectTools = () => {
    if (IS_RESTRICTED) {
      return (
        <View style={{ marginBottom: 10 }}>
          <NoProjectTools />
        </View>
      );
    } else {
      return <ProjectTools pollForUpdates={this.props.isFocused} />;
    }
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
        iconUrl={project.manifest && project.manifest.iconUrl}
        releaseChannel={
          /* 28/11/17(brentvatne) - we can remove extractReleaseChannel in a couple of months
          when project history is unlikely to include any projects with release channels */
          (project.manifest && project.manifest.releaseChannel) ||
          extractReleaseChannel(project.manifestUrl)
        }
        projectName={project.manifest && project.manifest.name}
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

  _renderConstants = () => {
    return (
      <View style={styles.constantsContainer}>
        <Text style={styles.deviceIdText} onPress={this._copySnackIdToClipboard}>
          Device ID: {getSnackId()}
        </Text>
        <Text style={styles.expoVersionText} onPress={this._copyClientVersionToClipboard}>
          Client version: {Constants.expoVersion}
        </Text>
      </View>
    );
  };

  _copySnackIdToClipboard = () => {
    Clipboard.setString(getSnackId());

    // Should have some integrated alert banner
    alert('The device ID has been copied to your clipboard');
  };

  _copyClientVersionToClipboard = () => {
    Clipboard.setString(Constants.expoVersion);
    alert('The client version has been copied to your clipboard');
  };

  _renderProjects = () => {
    let { projects } = this.state;

    if (projects && projects.length) {
      return (
        <View style={styles.inDevelopmentContainer}>
          {projects.map((project, i) => (
            <SmallProjectCard
              icon={
                project.source === 'desktop'
                  ? require('../assets/cli.png')
                  : require('../assets/snack.png')
              }
              projectName={project.description}
              key={project.url}
              projectUrl={project.url}
              iconBorderStyle={{
                borderWidth: 1,
                borderColor: 'rgba(0, 0, 32, 0.1)',
              }}
              fullWidthBorder={i === projects.length - 1}
            />
          ))}
        </View>
      );
    } else {
      return <NoProjectsOpen isAuthenticated={this.props.isAuthenticated} />;
    }
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.greyBackground,
  },
  inDevelopmentContainer: {
    marginBottom: 15,
  },
  infoContainer: {
    paddingTop: 13,
    flexDirection: 'column',
    alignSelf: 'stretch',
    paddingBottom: 10,
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
  constantsContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
    justifyContent: 'flex-end',
    alignItems: 'center',
    flex: 1,
  },
  deviceIdText: {
    color: 'rgba(0,0,0,0.3)',
    fontSize: 11,
    marginBottom: 5,
  },
  expoVersionText: {
    color: 'rgba(0,0,0,0.3)',
    fontSize: 11,
  },
});
