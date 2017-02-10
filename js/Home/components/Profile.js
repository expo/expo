import React from 'react';
import { Asset } from 'exponent';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FadeIn from '@exponent/react-native-fade-in-image';
import {
  SlidingTabNavigationItem,
} from '@exponent/ex-navigation';

import {
  take,
  takeRight,
} from 'lodash';
import dedent from 'dedent';

import Colors from '../constants/Colors';
import PrimaryButton from './PrimaryButton';
import SeeAllProjectsButton from './SeeAllProjectsButton';
import SharedStyles from '../constants/SharedStyles';
import SmallProjectCard from './SmallProjectCard';
import StyledSlidingTabNavigation from '../navigation/StyledSlidingTabNavigation';

const MAX_APPS_TO_DISPLAY = 3;
const MAX_LIKES_TO_DISPLAY = 3;

const NETWORK_ERROR_TEXT = dedent(`
  Your connection appears to be offline.
  Get out of the subway tunnel or connect to a better wifi network and check back.
`);

const SERVER_ERROR_TEXT = dedent(`
  An unexpected server error has occurred.
  Sorry about this. We will resolve the issue as soon as quickly as possible.
`);

export default class Profile extends React.Component {
  state = {
    isRefetching: false,
  }

  render() {
    if (this.props.data.error) {
      return this._renderError();
    }

    return (
      <ScrollView style={styles.container}>
        {this._renderHeader()}
        {this._renderApps()}
      </ScrollView>
    );
  }

  _renderError = () => {
    if (this.state.isRefetching) {
      return this._renderLoading();
    }

    // NOTE(brentvatne): sorry for this
    let isConnectionError =
      this.props.data.error.message.includes('No connection available');

    return (
      <View style={{flex: 1, alignItems: 'center', paddingTop: 30}}>
        <Text style={SharedStyles.noticeDescriptionText}>
          {isConnectionError ? NETWORK_ERROR_TEXT : SERVER_ERROR_TEXT}
        </Text>

        <PrimaryButton
          plain
          onPress={this._refetchDataAsync}
          fallback={TouchableOpacity}>
          Try again
        </PrimaryButton>
      </View>
    );
  }

  _refetchDataAsync = async () => {
    try {
      this.setState({isRefetching: true});
      await this.props.data.refetch()
    } catch(e) {
      console.log({e});
      // Error!
    } finally {
      this.setState({isRefetching: false});
    }
  }

  _renderLoading() {
    return (
      <View style={{flex: 1, padding: 30, alignItems: 'center'}}>
        <ActivityIndicator />
      </View>
    );
  }

  _renderHeader = () => {
    if (this.props.data.loading && !this.props.data.user) {
      return this._renderLoading();
    }

    if (!this.props.data.user) {
      return;
    }

    if (this.props.data.user.isLegacy) {
      return this._renderLegacyHeader();
    }

    let {
      firstName,
      lastName,
      username,
      profilePhoto,
    } = this.props.data.user;

    return (
      <View style={styles.header}>
        <FadeIn>
          <Image
            style={styles.headerAvatar}
            source={{uri: profilePhoto}}
          />
        </FadeIn>
        <Text style={styles.headerFullNameText}>
          {firstName} {lastName}
        </Text>
        <View style={styles.headerAccountsList}>
          <Text style={styles.headerAccountText}>
            @{username}
          </Text>
          {this._maybeRenderGithubAccount()}
        </View>
      </View>
    );
  }

  _renderLegacyHeader = () => {
    let { username } = this.props.data.user;

    return (
      <View style={styles.header}>
        <View style={[styles.headerAvatar, styles.legacyHeaderAvatar]} />
        <View style={styles.headerAccountsList}>
          <Text style={styles.headerAccountText}>
            @{username}
          </Text>
        </View>
      </View>
    );
  }

  _renderApps = () => {
    if (!this.props.data.user) {
      return;
    }

    let { apps, appCount } = this.props.data.user;

    if (!apps || !apps.length) {
      // Handle empty app case
      return null;
    } else {
      let appsToDisplay = take(apps, MAX_APPS_TO_DISPLAY);
      let otherApps = takeRight(apps, Math.max(0, apps.length - MAX_APPS_TO_DISPLAY));

      return (
        <View>
          <View style={[SharedStyles.sectionLabelContainer, {marginTop: 10}]}>
            <Text style={SharedStyles.sectionLabelText}>PROJECTS</Text>
          </View>

          {take(apps, 3).map(this._renderApp)}
          <SeeAllProjectsButton
            apps={otherApps}
            appCount={appCount - 3}
            label="See all projects"
            onPress={this._handlePressProjectList}
          />
        </View>
      );
    }
  }

  _handlePressProjectList = () => {
    this.props.navigator.push('projectsForUser', {
      username: this.props.username,
      belongsToCurrentUser: this.props.isOwnProfile
    });
  }

  _renderApp = (app, i) => {
    return (
      <SmallProjectCard
        key={i}
        iconUrl={app.iconUrl}
        likeCount={app.likeCount}
        projectName={app.packageName}
        projectUrl={app.fullName}
        fullWidthBorder
      />
    );
  }

  _maybeRenderGithubAccount() {
    // ..
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.greyBackground,
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  headerAvatar: {
    marginTop: 20,
    marginBottom: 12,
    height: 64,
    width: 64,
    borderRadius: 5,
  },
  legacyHeaderAvatar: {
    backgroundColor: '#eee',
  },
  headerAccountsList: {
    paddingBottom: 20,
  },
  headerAccountText: {
    color: 'rgba(36, 44, 58, 0.4)',
    fontSize: 14,
  },
  headerFullNameText: {
    color: '#232B3A',
    fontSize: 20,
    fontWeight: '500',
  },
});
