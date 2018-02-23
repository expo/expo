/* @flow */

import React from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FadeIn from '@expo/react-native-fade-in-image';

import { take, takeRight } from 'lodash';
import dedent from 'dedent';

import Alerts from '../constants/Alerts';
import Colors from '../constants/Colors';
import PrimaryButton from './PrimaryButton';
import EmptyProfileProjectsNotice from './EmptyProfileProjectsNotice';
import SeeAllProjectsButton from './SeeAllProjectsButton';
import SharedStyles from '../constants/SharedStyles';
import SmallProjectCard from './SmallProjectCard';

const MAX_APPS_TO_DISPLAY = 3;
// const MAX_LIKES_TO_DISPLAY = 3;

const NETWORK_ERROR_TEXT = dedent`
  Your connection appears to be offline.
  Get out of the subway tunnel or connect to a better wifi network and check back.
`;

const SERVER_ERROR_TEXT = dedent`
  An unexpected error has occurred.
  Sorry about this. We will resolve the issue as soon as possible.
`;

export default class Profile extends React.Component {
  state = {
    isRefetching: false,
  };

  _isMounted: boolean;

  componentWillMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  componentWillReceiveProps(nextProps: any) {
    const SkipConnectionNotification = true;
    if (!SkipConnectionNotification && !this.props.data.error && nextProps.data.error) {
      // NOTE(brentvatne): sorry for this
      let isConnectionError = nextProps.data.error.message.includes('No connection available');

      if (isConnectionError) {
        this.props.navigator.showLocalAlert('No connection available', Alerts.error);
      }
    }
  }

  render() {
    // NOTE(brentvatne): investigate why `user` is null when there
    // is an error, even if it loaded before. This seems undesirable,
    // can it be avoided with apollo-client?
    if (this.props.data.error && !this.props.data.user) {
      return this._renderError();
    }

    if (this.props.data.loading && !this.props.data.user) {
      return this._renderLoading();
    }

    return (
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={this.state.isRefetching}
            onRefresh={this._handleRefreshAsync}
          />
        }
        style={styles.container}>
        {this._renderHeader()}
        {this._renderApps()}
      </ScrollView>
    );
  }

  _handleRefreshAsync = async () => {
    if (this.state.isRefetching) {
      return;
    }

    try {
      this.setState({ isRefetching: true });
      this.props.data.refetch({ fetchPolicy: 'network-only' });
    } catch (e) {
      // TODO(brentvatne): Put this into Sentry
      console.log({ e });
    } finally {
      // Add a slight delay so it doesn't just disappear immediately,
      // this actually looks nicer because you might think that it
      // didn't work if it disappears too quickly
      setTimeout(() => {
        if (this._isMounted) {
          this.setState({ isRefetching: false });
        }
      }, 500);
    }
  };

  _renderError = () => {
    // NOTE(brentvatne): sorry for this
    let isConnectionError = this.props.data.error.message.includes('No connection available');

    return (
      <View style={{ flex: 1, alignItems: 'center', paddingTop: 30 }}>
        <Text style={SharedStyles.noticeDescriptionText}>
          {isConnectionError ? NETWORK_ERROR_TEXT : SERVER_ERROR_TEXT}
        </Text>

        <PrimaryButton plain onPress={this._handleRefreshAsync} fallback={TouchableOpacity}>
          Try again
        </PrimaryButton>

        {this.state.isRefetching && (
          <View style={{ marginTop: 20 }}>
            <ActivityIndicator />
          </View>
        )}
      </View>
    );
  };

  _renderLoading() {
    return (
      <View style={{ flex: 1, padding: 30, alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  _renderHeader = () => {
    if (!this.props.data.user) {
      return;
    }

    if (this.props.data.user.isLegacy) {
      return this._renderLegacyHeader();
    }

    let { firstName, lastName, username, profilePhoto } = this.props.data.user;

    return (
      <View style={styles.header}>
        <View style={styles.headerAvatarContainer}>
          <FadeIn>
            <Image style={styles.headerAvatar} source={{ uri: profilePhoto }} />
          </FadeIn>
        </View>
        <Text style={styles.headerFullNameText}>
          {firstName} {lastName}
        </Text>
        <View style={styles.headerAccountsList}>
          <Text style={styles.headerAccountText}>@{username}</Text>
          {this._maybeRenderGithubAccount()}
        </View>
      </View>
    );
  };

  _renderLegacyHeader = () => {
    let { username } = this.props.data.user;

    return (
      <View style={styles.header}>
        <View
          style={[styles.headerAvatar, styles.headerAvatarContainer, styles.legacyHeaderAvatar]}
        />
        <View style={styles.headerAccountsList}>
          <Text style={styles.headerAccountText}>@{username}</Text>
        </View>
      </View>
    );
  };

  _renderApps = () => {
    if (!this.props.data.user) {
      return;
    }

    let { apps, appCount } = this.props.data.user;

    if (!apps || !apps.length) {
      return <EmptyProfileProjectsNotice isOwnProfile={this.props.isOwnProfile} />;
    } else {
      // let appsToDisplay = take(apps, MAX_APPS_TO_DISPLAY);
      let otherApps = takeRight(apps, Math.max(0, apps.length - MAX_APPS_TO_DISPLAY));

      return (
        <View>
          <View style={[SharedStyles.sectionLabelContainer, { marginTop: 10 }]}>
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
  };

  _handlePressProjectList = () => {
    this.props.navigator.push('projectsForUser', {
      username: this.props.username,
      belongsToCurrentUser: this.props.isOwnProfile,
    });
  };

  _renderApp = (app: any, i: number) => {
    return (
      <SmallProjectCard
        key={i}
        hideUsername
        iconUrl={app.iconUrl}
        likeCount={app.likeCount}
        projectName={app.name}
        slug={app.packageName}
        projectUrl={app.fullName}
        privacy={app.privacy}
        fullWidthBorder
      />
    );
  };

  _maybeRenderGithubAccount() {
    // ..
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.greyBackground,
    marginTop: -1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: Colors.separator,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  headerAvatarContainer: {
    marginTop: 20,
    marginBottom: 12,
    overflow: 'hidden',
    borderRadius: 5,
  },
  headerAvatar: {
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
