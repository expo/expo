/**
 * @flow
 */

import Constants from 'expo-constants';
import React from 'react';
import {
  AppState,
  Alert,
  Clipboard,
  Platform,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { withNavigationFocus, withNavigation, Themed } from 'react-navigation';
import { connect } from 'react-redux';
import semver from 'semver';

import ApiV2HttpClient from '../api/ApiV2HttpClient';
import ScrollView from '../components/NavigationScrollView';
import Environment from '../utils/Environment';
import addListenerWithNativeCallback from '../utils/addListenerWithNativeCallback';
import DevIndicator from '../components/DevIndicator';
import HistoryActions from '../redux/HistoryActions';
import OpenProjectByURLButton from '../components/OpenProjectByURLButton';
import NoProjectTools from '../components/NoProjectTools';
import NoProjectsOpen from '../components/NoProjectsOpen';
import ProjectTools from '../components/ProjectTools';
import Connectivity from '../api/Connectivity';
import getSnackId from '../utils/getSnackId';
import { StyledText } from '../components/Text';
import ListItem from '../components/ListItem';
import ProjectListItem from '../components/ProjectListItem';
import SectionHeader from '../components/SectionHeader';

import extractReleaseChannel from '../utils/extractReleaseChannel';

const IS_RESTRICTED = Environment.IsIOSRestrictedBuild;
const PROJECT_UPDATE_INTERVAL = 10000;

const SupportedExpoSdks = Constants.supportedExpoSdks || [];

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
        headerRight: () => (Constants.isDevice ? null : <OpenProjectByURLButton />),
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

    // NOTE(brentvatne): if we add QR code button to the menu again, we'll need to
    // find a way to move this listener up to the root of the app in order to ensure
    // that it has been registered regardless of whether we have been on the project
    // screen in the home app
    addListenerWithNativeCallback('ExponentKernel.showQRReader', async event => {
      this.props.navigation.showModal('QRCode');
      return { success: true };
    });
  }

  componentWillUnmount() {
    this._stopPollingForProjects();
    AppState.removeEventListener('change', this._maybeResumePollingFromAppState);
    Connectivity.removeListener(this._updateConnectivity);
  }

  render() {
    const { projects, isNetworkAvailable, isRefreshing } = this.state;

    return (
      <View style={styles.container}>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={this._handleRefreshAsync} />
          }
          key={Platform.OS === 'ios' ? this.props.allHistory.count() : 'scroll-view'}
          stickyHeaderIndices={Platform.OS === 'ios' ? [0, 2, 4] : []}
          style={styles.container}
          contentContainerStyle={styles.contentContainer}>
          <SectionHeader
            title={
              (Platform.OS === 'ios' && Environment.IOSClientReleaseType === 'SIMULATOR') ||
              (Platform.OS === 'android' && !Constants.isDevice)
                ? 'Clipboard'
                : 'Tools'
            }
          />
          {this._renderProjectTools()}

          <SectionHeader
            title="Recently in development"
            buttonLabel="Help"
            onPress={this._handlePressHelpProjects}
            leftContent={
              <DevIndicator
                style={styles.devIndicator}
                isActive={projects && projects.length}
                isNetworkAvailable={isNetworkAvailable}
              />
            }
          />
          {this._renderProjects()}

          <SectionHeader
            title="Recently opened"
            buttonLabel="Clear"
            onPress={this._handlePressClearHistory}
          />
          {this._renderRecentHistory()}
          {this._renderConstants()}
        </ScrollView>

        <Themed.StatusBar />
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
      let api = new ApiV2HttpClient();
      let projects = await api.getAsync('development-sessions', {
        deviceId: getSnackId(),
      });
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

    let baseMessage = `Make sure you are signed in to the same Expo account on your computer and this app. Also verify that your computer is connected to the internet, and ideally to the same Wi-Fi network as your mobile device. Lastly, ensure that you are using the latest version of Expo CLI. Pull to refresh to update.`;
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
      return <NoProjectTools />;
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
    return <ListItem subtitle={`You haven't opened any projects recently.`} last />;
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

    return this.props.recentHistory.map((project, i) => {
      const username = project.manifestUrl.includes('exp://exp.host')
        ? extractUsername(project.manifestUrl)
        : undefined;
      /* 28/11/17(brentvatne) - we can remove extractReleaseChannel in a couple of months
          when project history is unlikely to include any projects with release channels */
      let releaseChannel =
        project.manifest?.releaseChannel || extractReleaseChannel(project.manifestUrl);
      releaseChannel = releaseChannel === 'default' ? undefined : releaseChannel;
      return (
        <ProjectListItem
          key={project.manifestUrl}
          url={project.manifestUrl}
          image={project.manifest?.iconUrl}
          platform={project.platform}
          title={project.manifest?.name}
          subtitle={username || project.manifestUrl}
          username={username}
          releaseChannel={releaseChannel}
          last={i === this.props.recentHistory.count() - 1}
        />
      );
    });
  };

  _renderConstants = () => {
    return (
      <View style={styles.constantsContainer}>
        <StyledText
          style={styles.deviceIdText}
          onPress={this._copySnackIdToClipboard}
          lightColor="rgba(0,0,0,0.3)"
          darkColor="rgba(255,255,255,0.6)">
          Device ID: {getSnackId()}
        </StyledText>
        <StyledText
          style={styles.expoVersionText}
          onPress={this._copyClientVersionToClipboard}
          lightColor="rgba(0,0,0,0.3)"
          darkColor="rgba(255,255,255,0.6)">
          Client version: {Constants.expoVersion}
        </StyledText>
        <StyledText
          style={styles.supportSdksText}
          lightColor="rgba(0,0,0,0.3)"
          darkColor="rgba(255,255,255,0.6)">
          Supported SDK
          {SupportedExpoSdks.length === 1 ? ': ' : 's: '}
          {SupportedExpoSdks.map(semver.major)
            .sort((a, b) => a - b)
            .join(', ')}
        </StyledText>
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
        <View>
          {projects.map((project, i) => (
            <ProjectListItem
              key={project.url}
              url={project.url}
              image={
                project.source === 'desktop'
                  ? require('../assets/cli.png')
                  : require('../assets/snack.png')
              }
              imageStyle={styles.projectImageStyle}
              title={project.description}
              platform={project.platform}
              subtitle={project.url}
              last={i === projects.length - 1}
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
  },
  contentContainer: {
    paddingTop: 5,
  },
  projectImageStyle: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 32, 0.1)',
  },
  constantsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: 'flex-end',
    alignItems: 'center',
    flex: 1,
  },
  devIndicator: {
    marginRight: 7,
  },
  deviceIdText: {
    fontSize: 11,
    marginBottom: 5,
  },
  expoVersionText: {
    fontSize: 11,
    marginBottom: 5,
  },
  supportSdksText: {
    fontSize: 11,
  },
});
