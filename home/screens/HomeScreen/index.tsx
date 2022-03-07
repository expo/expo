import { spacing } from '@expo/styleguide-native';
import { StackScreenProps } from '@react-navigation/stack';
import { HomeScreenHeader } from 'components/HomeScreenHeader';
import Constants from 'expo-constants';
import { View, Divider, ThemeContext } from 'expo-dev-client-components';
import { CurrentUserDataFragment, useHome_CurrentUserQuery } from 'graphql/types';
import * as React from 'react';
import { Alert, AppState, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ApiV2HttpClient from '../../api/ApiV2HttpClient';
import Connectivity from '../../api/Connectivity';
import ScrollView from '../../components/NavigationScrollView';
import RefreshControl from '../../components/RefreshControl';
import ThemedStatusBar from '../../components/ThemedStatusBar';
import { HomeStackRoutes } from '../../navigation/Navigation.types';
import HistoryActions from '../../redux/HistoryActions';
import { useDispatch, useSelector } from '../../redux/Hooks';
import { DevSession, HistoryList } from '../../types';
import addListenerWithNativeCallback from '../../utils/addListenerWithNativeCallback';
import getSnackId from '../../utils/getSnackId';
import isUserAuthenticated from '../../utils/isUserAuthenticated';
import { DevelopmentServerListItem } from './DevelopmentServerListItem';
import { DevelopmentServersHeader } from './DevelopmentServersHeader';
import { DevelopmentServersPlaceholder } from './DevelopmentServersPlaceholder';
import { RecentlyOpenedHeader } from './RecentlyOpenedHeader';
import { RecentlyOpenedSection } from './RecentlyOpenedSection';

const PROJECT_UPDATE_INTERVAL = 10000;

type Props = NavigationProps & {
  dispatch: (data: any) => any;
  isFocused: boolean;
  recentHistory: HistoryList;
  allHistory: HistoryList;
  isAuthenticated: boolean;
  currentUser?: CurrentUserDataFragment;
  theme: string;
};

type State = {
  projects: DevSession[];
  isNetworkAvailable: boolean;
  isRefreshing: boolean;
};

type NavigationProps = StackScreenProps<HomeStackRoutes, 'Home'>;

export default function HomeScreen(props: NavigationProps) {
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

  const { data: currentUserData } = useHome_CurrentUserQuery();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ThemeContext.Consumer>
        {(theme) => (
          <ProjectsView
            theme={theme}
            {...props}
            isFocused={isFocused}
            dispatch={dispatch}
            recentHistory={recentHistory}
            allHistory={allHistory}
            isAuthenticated={isAuthenticated}
            currentUser={currentUserData?.viewer ?? undefined}
          />
        )}
      </ThemeContext.Consumer>
    </SafeAreaView>
  );
}

class ProjectsView extends React.Component<Props, State> {
  private _projectPolling?: ReturnType<typeof setInterval>;

  state: State = {
    projects: [],
    isNetworkAvailable: Connectivity.isAvailable(),
    isRefreshing: false,
  };

  componentDidMount() {
    AppState.addEventListener('change', this._maybeResumePollingFromAppState);
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
    AppState.removeEventListener('change', this._maybeResumePollingFromAppState);
    Connectivity.removeListener(this._updateConnectivity);
  }

  render() {
    const { projects, isRefreshing } = this.state;

    return (
      <View style={styles.container}>
        <HomeScreenHeader currentUser={this.props.currentUser} />
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={this._handleRefreshAsync} />
          }
          key={Platform.OS === 'ios' ? this.props.allHistory.count() : 'scroll-view'}
          style={styles.container}
          contentContainerStyle={[styles.contentContainer]}>
          <DevelopmentServersHeader onHelpPress={this._handlePressHelpProjects} />
          {projects?.length ? (
            <View bg="default" rounded="large">
              {projects.map((project, i) => (
                <React.Fragment key={project.url}>
                  <DevelopmentServerListItem
                    url={project.url}
                    image={
                      project.source === 'desktop'
                        ? require('../../assets/cli.png')
                        : require('../../assets/snack.png')
                    }
                    imageStyle={styles.projectImageStyle}
                    title={project.description}
                    platform={project.platform}
                    subtitle={project.url}
                  />
                  {projects.length > 1 && i !== projects.length - 1 ? <Divider /> : null}
                </React.Fragment>
              ))}
            </View>
          ) : (
            <DevelopmentServersPlaceholder />
          )}
          {this.props.recentHistory.count() ? (
            <>
              <RecentlyOpenedHeader onClearPress={this._handlePressClearHistory} />
              <RecentlyOpenedSection recentHistory={this.props.recentHistory} />
            </>
          ) : null}
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

  private _handlePressClearHistory = () => {
    this.props.dispatch(HistoryActions.clearHistory());
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
    } catch (e) {
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing[4],
    flex: 1,
  },
  projectImageStyle: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 32, 0.1)',
  },
});
