import { StackScreenProps } from '@react-navigation/stack';
import Constants from 'expo-constants';
import * as React from 'react';
import {
  Alert,
  AppState,
  Clipboard,
  Linking,
  NativeEventSubscription,
  Platform,
  StyleSheet,
  View,
} from 'react-native';

import ApiV2HttpClient from '../api/ApiV2HttpClient';
import Config from '../api/Config';
import Connectivity from '../api/Connectivity';
import DevIndicator from '../components/DevIndicator';
import ListItem from '../components/ListItem';
import ScrollView from '../components/NavigationScrollView';
import NoProjectsOpen from '../components/NoProjectsOpen';
import ProjectListItem from '../components/ProjectListItem';
import ProjectTools from '../components/ProjectTools';
import RefreshControl from '../components/RefreshControl';
import SectionHeader from '../components/SectionHeader';
import { StyledText } from '../components/Text';
import ThemedStatusBar from '../components/ThemedStatusBar';
import { AllStackRoutes } from '../navigation/Navigation.types';
import HistoryActions from '../redux/HistoryActions';
import { useDispatch, useSelector } from '../redux/Hooks';
import { DevSession, HistoryList } from '../types';
import Environment from '../utils/Environment';
import addListenerWithNativeCallback from '../utils/addListenerWithNativeCallback';
import getSnackId from '../utils/getSnackId';
import isUserAuthenticated from '../utils/isUserAuthenticated';

const PROJECT_UPDATE_INTERVAL = 10000;

type Props = NavigationProps & {
  dispatch: (data: any) => any;
  isFocused: boolean;
  recentHistory: HistoryList;
  allHistory: HistoryList;
  isAuthenticated: boolean;
};

type State = {
  projects: DevSession[];
  isNetworkAvailable: boolean;
  isRefreshing: boolean;
};

type NavigationProps = StackScreenProps<AllStackRoutes, 'Projects'>;

export default function ProjectsScreen(props: NavigationProps) {
  const [isFocused, setFocused] = React.useState(true);
  React.useEffect(() => {
    const unsubscribe = props.navigation.addListener('focus', () => {
      setFocused(true);
    });
    const unsubscribeBlur = props.navigation.addListener('blur', () => {
      setFocused(false);
    });

    return () => {
      unsubscribe();
      unsubscribeBlur();
    };
  }, [props.navigation]);

  const dispatch = useDispatch();
  const { recentHistory, allHistory, isAuthenticated } = useSelector(
    React.useCallback((data) => {
      const { history } = data.history;

      return {
        recentHistory: history.take(10) as HistoryList,
        allHistory: history as HistoryList,
        isAuthenticated: isUserAuthenticated(data.session),
      };
    }, [])
  );
  return (
    <ProjectsView
      {...props}
      isFocused={isFocused}
      dispatch={dispatch}
      recentHistory={recentHistory}
      allHistory={allHistory}
      isAuthenticated={isAuthenticated}
    />
  );
}

class ProjectsView extends React.Component<Props, State> {
  private _projectPolling?: ReturnType<typeof setInterval>;
  private _changeEventListener?: NativeEventSubscription;

  state: State = {
    projects: [],
    isNetworkAvailable: Connectivity.isAvailable(),
    isRefreshing: false,
  };

  componentDidMount() {
    this._changeEventListener = AppState.addEventListener(
      'change',
      this._maybeResumePollingFromAppState
    );
    Connectivity.addListener(this._updateConnectivity);

    // @evanbacon: Without this setTimeout, the state doesn't update correctly and the "Recently in Development" items don't load for 10 seconds.
    setTimeout(() => {
      this._startPollingForProjects();
    }, 1);

    // NOTE(brentvatne): if we add QR code button to the menu again, we'll need to
    // find a way to move this listener up to the root of the app in order to ensure
    // that it has been registered regardless of whether we have been on the project
    // screen in the home app
    addListenerWithNativeCallback('ExponentKernel.showQRReader', async () => {
      // @ts-ignore
      this.props.navigation.navigate('QRCode');
      return { success: true };
    });
  }

  componentWillUnmount() {
    this._stopPollingForProjects();
    this._changeEventListener?.remove();
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
                isActive={projects && !!projects.length}
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
        <ThemedStatusBar />
      </View>
    );
  }

  componentDidUpdate(prevProps: Props) {
    if (!prevProps.isFocused && this.props.isFocused) {
      this._fetchProjectsAsync();
    }

    if (prevProps.isAuthenticated && !this.props.isAuthenticated) {
      // Remove all projects except Snack, because they are tied to device id
      // Fix this lint warning when converting to hooks
      // eslint-disable-next-line
      this.setState(({ projects }) => ({
        projects: projects.filter((p) => p.source === 'snack'),
      }));
    }
  }

  private _updateConnectivity = (isAvailable: boolean): void => {
    if (isAvailable !== this.state.isNetworkAvailable) {
      this.setState({ isNetworkAvailable: isAvailable });
    }
  };

  private _maybeResumePollingFromAppState = (nextAppState: string): void => {
    if (nextAppState === 'active' && !this._projectPolling) {
      this._startPollingForProjects();
    } else {
      this._stopPollingForProjects();
    }
  };

  private _startPollingForProjects = async () => {
    this._fetchProjectsAsync();
    this._projectPolling = setInterval(this._fetchProjectsAsync, PROJECT_UPDATE_INTERVAL);
  };

  private _stopPollingForProjects = async () => {
    if (this._projectPolling) {
      clearInterval(this._projectPolling);
    }
    this._projectPolling = undefined;
  };

  private _fetchProjectsAsync = async () => {
    try {
      const api = new ApiV2HttpClient();
      const projects = await api.getAsync('development-sessions', {
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

  private _handleRefreshAsync = async () => {
    this.setState({ isRefreshing: true });

    try {
      await Promise.all([
        this._fetchProjectsAsync(),
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ]);
    } catch {
      // not sure what to do here, maybe nothing?
    } finally {
      this.setState({ isRefreshing: false });
    }
  };

  private _handlePressHelpProjects = () => {
    if (!this.state.isNetworkAvailable) {
      Alert.alert(
        'No network connection available',
        `You must be connected to the internet to view a list of your projects open in development.`
      );
    }

    const baseMessage = `Make sure you are signed in to the same Expo account on your computer and this app. Also verify that your computer is connected to the internet, and ideally to the same Wi-Fi network as your mobile device. Lastly, ensure that you are using the latest version of Expo CLI. Pull to refresh to update.`;
    const message = Platform.select({
      ios: Constants.isDevice
        ? baseMessage
        : `${baseMessage} If this still doesn't work, press the + icon on the header to type the project URL manually.`,
      android: baseMessage,
    });
    Alert.alert('Troubleshooting', message);
  };

  private _handlePressClearHistory = () => {
    this.props.dispatch(HistoryActions.clearHistory());
  };

  private _renderProjectTools = () => {
    // Disable polling the clipboard on iOS because it presents a notification every time the clipboard is read.
    const pollForUpdates = this.props.isFocused && Platform.OS !== 'ios';
    return <ProjectTools pollForUpdates={pollForUpdates} />;
  };

  private _renderRecentHistory = () => {
    return this.props.allHistory.count() === 0
      ? this._renderEmptyRecentHistory()
      : this._renderRecentHistoryItems();
  };

  private _renderEmptyRecentHistory = () => {
    return <ListItem subtitle={`You haven't opened any projects recently.`} last />;
  };

  private _renderRecentHistoryItems = () => {
    const extractUsername = (manifestUrl: string) => {
      const usernameMatches = manifestUrl.match(/@.*?\//);
      if (!usernameMatches) {
        return null;
      }
      const username = usernameMatches[0];
      if (!username) {
        return null;
      } else {
        return username.slice(0, username.length - 1);
      }
    };

    return this.props.recentHistory.map((project, i) => {
      if (!project) return null;
      const username = project.manifestUrl.includes(`exp://${Config.api.host}`)
        ? extractUsername(project.manifestUrl)
        : undefined;
      let releaseChannel =
        project.manifest && 'releaseChannel' in project.manifest
          ? project.manifest.releaseChannel
          : null;
      releaseChannel = releaseChannel === 'default' ? undefined : releaseChannel;
      return (
        <ProjectListItem
          key={project.manifestUrl}
          url={project.manifestUrl}
          image={
            // TODO(wschurman): audit for new manifests
            project.manifest && 'iconUrl' in project.manifest ? project.manifest.iconUrl : undefined
          }
          title={
            // TODO(wschurman): audit for new manifests
            project.manifest && 'name' in project.manifest ? project.manifest.name : undefined
          }
          subtitle={username || project.manifestUrl}
          username={username ?? undefined}
          releaseChannel={releaseChannel ?? undefined}
          onPress={() => Linking.openURL(project.url)}
          last={i === this.props.recentHistory.count() - 1}
        />
      );
    });
  };

  private _renderConstants = () => {
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
          Supported {Environment.supportedSdksString}
        </StyledText>
      </View>
    );
  };

  private _copySnackIdToClipboard = () => {
    Clipboard.setString(getSnackId());

    // Should have some integrated alert banner
    alert('The device ID has been copied to your clipboard');
  };

  private _copyClientVersionToClipboard = () => {
    if (Constants.expoVersion) {
      Clipboard.setString(Constants.expoVersion);
      alert(`The app's version has been copied to your clipboard.`);
    } else {
      // this should not ever happen
      alert(`Something went wrong - the app's version is not available.`);
    }
  };

  private _renderProjects = () => {
    const { projects } = this.state;

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
