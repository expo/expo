/* @flow */
import React from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FadeIn from 'react-native-fade-in-image';

import { take, takeRight } from 'lodash';
import dedent from 'dedent';

import Colors from '../constants/Colors';
import PrimaryButton from './PrimaryButton';
import EmptyProfileProjectsNotice from './EmptyProfileProjectsNotice';
import EmptyProfileSnacksNotice from './EmptyProfileSnacksNotice';
import SeeAllProjectsButton from './SeeAllProjectsButton';
import SeeAllSnacksButton from './SeeAllSnacksButton';
import SharedStyles from '../constants/SharedStyles';
import SmallProjectCard from './SmallProjectCard';
import SnackCard from './SnackCard';
import ScrollView from '../components/NavigationScrollView';
import { SectionLabelText, StyledText } from '../components/Text';
import { SectionLabelContainer, StyledView } from '../components/Views';

const MAX_APPS_TO_DISPLAY = 3;
const MAX_SNACKS_TO_DISPLAY = 3;

const NETWORK_ERROR_TEXT = dedent`
  Your connection appears to be offline.
  Get out of the subway tunnel or connect to a better Wi-Fi network and check back.
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

  componentDidMount() {
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
        // Should have some integrated alert banner
        alert('No connection available');
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
        contentContainerStyle={{ paddingBottom: 20 }}
        style={styles.container}>
        {this._renderHeader()}
        {this._renderApps()}
        {this._renderSnacks()}
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
    let isConnectionError = this.props.data?.error?.message?.includes('No connection available');

    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flex: 1, alignItems: 'center', paddingTop: 30 }}>
        <StyledText
          style={SharedStyles.noticeDescriptionText}
          lightColor="rgba(36, 44, 58, 0.7)"
          darkColor="#ccc">
          {isConnectionError ? NETWORK_ERROR_TEXT : SERVER_ERROR_TEXT}
        </StyledText>

        <PrimaryButton plain onPress={this._handleRefreshAsync} fallback={TouchableOpacity}>
          Try again
        </PrimaryButton>

        {this.state.isRefetching && (
          <View style={{ marginTop: 20 }}>
            <ActivityIndicator color={Colors.light.tintColor} />
          </View>
        )}
      </ScrollView>
    );
  };

  _renderLoading() {
    return (
      <View style={{ flex: 1, padding: 30, alignItems: 'center' }}>
        <ActivityIndicator color={Colors.light.tintColor} />
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
      <StyledView style={styles.header} darkBackgroundColor="#000" darkBorderColor="#000">
        <View style={styles.headerAvatarContainer}>
          <FadeIn>
            <Image style={styles.headerAvatar} source={{ uri: profilePhoto }} />
          </FadeIn>
        </View>
        <StyledText style={styles.headerFullNameText}>
          {firstName} {lastName}
        </StyledText>
        <View style={styles.headerAccountsList}>
          <StyledText style={styles.headerAccountText} lightColor="#232B3A" darkColor="#ccc">
            @{username}
          </StyledText>
          {this._maybeRenderGithubAccount()}
        </View>
      </StyledView>
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
    let content;

    if (!apps || !apps.length) {
      content = <EmptyProfileProjectsNotice isOwnProfile={this.props.isOwnProfile} />;
    } else {
      let otherApps = takeRight(apps, Math.max(0, apps.length - MAX_APPS_TO_DISPLAY));
      content = (
        <>
          {take(apps, MAX_APPS_TO_DISPLAY).map(this._renderApp)}
          <SeeAllProjectsButton
            apps={otherApps}
            appCount={appCount - MAX_APPS_TO_DISPLAY}
            label="See all projects"
            onPress={this._handlePressProjectList}
          />
        </>
      );
    }

    return (
      <View style={{ marginBottom: 3 }}>
        <SectionLabelContainer style={{ marginTop: 10 }}>
          <SectionLabelText>PUBLISHED PROJECTS</SectionLabelText>
        </SectionLabelContainer>
        {content}
      </View>
    );
  };

  _renderSnacks = () => {
    if (!this.props.data.user) {
      return;
    }

    let { snacks } = this.props.data.user;
    let content;

    if (!snacks || !snacks.length) {
      content = <EmptyProfileSnacksNotice isOwnProfile={this.props.isOwnProfile} />;
    } else {
      let otherSnacks = takeRight(snacks, Math.max(0, snacks.length - MAX_SNACKS_TO_DISPLAY));
      content = (
        <>
          {take(snacks, MAX_SNACKS_TO_DISPLAY).map(this._renderSnack)}
          <SeeAllSnacksButton
            snacks={otherSnacks}
            label="See all Snacks"
            onPress={this._handlePressSnackList}
          />
        </>
      );
    }

    return (
      <View style={{ marginBottom: 3 }}>
        <SectionLabelContainer style={{ marginTop: 10 }}>
          <SectionLabelText>SAVED SNACKS</SectionLabelText>
        </SectionLabelContainer>
        {content}
      </View>
    );
  };

  _handlePressProjectList = () => {
    this.props.navigation.navigate('ProjectsForUser', {
      username: this.props.username,
      belongsToCurrentUser: this.props.isOwnProfile,
    });
  };

  _handlePressSnackList = () => {
    this.props.navigation.navigate('SnacksForUser', {
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
        projectName={app.name}
        slug={app.packageName}
        projectUrl={app.fullName}
        privacy={app.privacy}
        fullWidthBorder
      />
    );
  };

  _renderSnack = (snack: any, i: number) => {
    return (
      <SnackCard
        key={i}
        projectName={snack.name}
        description={snack.description}
        projectUrl={snack.fullName}
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
    marginTop: -1,
  },
  header: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
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
    // color: 'rgba(36, 44, 58, 0.4)',
    fontSize: 14,
  },
  headerFullNameText: {
    fontSize: 20,
    fontWeight: '500',
  },
});
