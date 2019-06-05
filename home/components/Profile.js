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
  Animated,
} from 'react-native';
import { ScrollView } from 'react-navigation';
import FadeIn from '@expo/react-native-fade-in-image';
import { LinearGradient } from 'expo-linear-gradient';
import { take, takeRight } from 'lodash';
import dedent from 'dedent';
import { connectActionSheet } from '@expo/react-native-action-sheet';

import Alerts from '../constants/Alerts';
import Colors from '../constants/Colors';
import PrimaryButton from './PrimaryButton';
import EmptyProfileProjectsNotice from './EmptyProfileProjectsNotice';
import EmptyProfileSnacksNotice from './EmptyProfileSnacksNotice';
import SeeAllProjectsButton from './SeeAllProjectsButton';
import SeeAllSnacksButton from './SeeAllSnacksButton';
import SharedStyles from '../constants/SharedStyles';
import SmallProjectCard from './SmallProjectCard';
import SnackCard from './SnackCard';
import { Constants, BlurView } from 'expo';

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

const BannerPhoto = ({ scroll, source }) => {
  const scale = scroll.interpolate({
    inputRange: [-50, 0],
    outputRange: [2, 1],
    extrapolateRight: 'clamp',
  });

  const translate = scroll.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-1, 0, 0.5],
  });

  const opacity = scroll.interpolate({
    inputRange: [-50, 0],
    outputRange: [1, 0],
  });

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { transform: [{ translateY: translate }, { scale }] }]}>
      <Animated.Image style={[{ flex: 1, resizeMode: 'cover' }]} source={source} />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
        <BlurView style={{ flex: 1 }} intensity={100} tint="light" />
      </Animated.View>
    </Animated.View>
  );
  //   <LinearGradient
  //   colors={['rgba(255,255,255,0)', Colors.greyBackground]}
  //   style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%' }}
  // />
};

const BannerButton = ({ onPress }) => (
  <TouchableOpacity onPress={onPress}>
    <View
      style={{
        opacity: 0.7,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderWidth: 1,
        backgroundColor: 'transparent',
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text style={{ textAlign: 'center', fontSize: 14, fontWeight: '500' }}>Change Banner</Text>
    </View>
  </TouchableOpacity>
);
@connectActionSheet
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
        // Should have some integrated alert banner
        alert('No connection available');
      }
    }
  }

  scroll = new Animated.Value(0);

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
      <Animated.ScrollView
        scrollEventThrottle={1}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: this.scroll } } }], {
          useNativeDriver: true,
        })}
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
      </Animated.ScrollView>
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

    const { image } = this.props;
    let { firstName, lastName, username, profilePhoto } = this.props.data.user;

    const verticalHeight = 72;
    const imagePeek = 16;
    const imageSize = 64;
    return (
      <View
        style={[styles.header, { alignItems: 'stretch', padding: 12, paddingTop: verticalHeight }]}>
        <BannerPhoto scroll={this.scroll} source={{ uri: image }} />
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: Colors.greyBackground,
            top: verticalHeight + imagePeek,
          }}
        />
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'flex-end',
          }}>
          <TouchableOpacity style={styles.headerAvatarContainer}>
            <FadeIn>
              <Image style={styles.headerAvatar} source={{ uri: profilePhoto }} />
            </FadeIn>
          </TouchableOpacity>
          <View>
            <Text style={styles.headerFullNameText}>
              {firstName} {lastName}
            </Text>
            <View style={{}}>
              <Text style={styles.headerAccountText}>@{username}</Text>
              {this._maybeRenderGithubAccount()}
            </View>
          </View>

          <View
            style={{
              flex: 1,
              height: imageSize - imagePeek,
              alignItems: 'flex-end',
              justifyContent: 'center',
            }}>
            <BannerButton onPress={this._showImageOptions} />
          </View>
        </View>
      </View>
    );
  };

  _showImageOptions = () => {
    let options = ['Choose Photo', 'Cancel'];
    if (Constants.isDevice) {
      options.unshift('Take Photo');
    }
    let cancelButtonIndex = options.length - 1;
    this.props.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
      },
      async buttonIndex => {
        const option = options[buttonIndex];
        if (option === 'Take Photo') {
          this.props.navigation.navigate('Camera', {
            username: this.props.username,
            belongsToCurrentUser: this.props.isOwnProfile,
          });
        } else if (option === 'Choose Photo') {
          this.props.navigation.navigate('MediaLibrary', {
            username: this.props.username,
            belongsToCurrentUser: this.props.isOwnProfile,
          });
        }
      }
    );
  };

  _renderLegacyHeader = () => {
    let { username } = this.props.data.user;

    return (
      <View style={styles.header}>
        <View
          style={[
            styles.headerAvatar,
            styles.legacyHeaderAvatarContainer,
            styles.legacyHeaderAvatar,
          ]}
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
        <React.Fragment>
          {take(apps, MAX_APPS_TO_DISPLAY).map(this._renderApp)}
          <SeeAllProjectsButton
            apps={otherApps}
            appCount={appCount - MAX_APPS_TO_DISPLAY}
            label="See all projects"
            onPress={this._handlePressProjectList}
          />
        </React.Fragment>
      );
    }

    return (
      <View style={{ marginBottom: 3 }}>
        <View style={[SharedStyles.sectionLabelContainer, {}]}>
          <Text style={SharedStyles.sectionLabelText}>PUBLISHED PROJECTS</Text>
        </View>
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
        <React.Fragment>
          {take(snacks, MAX_SNACKS_TO_DISPLAY).map(this._renderSnack)}
          <SeeAllSnacksButton
            snacks={otherSnacks}
            label="See all Snacks"
            onPress={this._handlePressSnackList}
          />
        </React.Fragment>
      );
    }

    return (
      <View style={{ marginBottom: 3 }}>
        <View style={[SharedStyles.sectionLabelContainer, { marginTop: 10 }]}>
          <Text style={SharedStyles.sectionLabelText}>SAVED SNACKS</Text>
        </View>
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
        likeCount={app.likeCount}
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
    backgroundColor: Colors.greyBackground,
    marginTop: -1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: Colors.separator,
  },
  headerAvatarContainer: {
    marginRight: 12,
    overflow: 'hidden',
    borderRadius: 5,
  },
  legacyHeaderAvatarContainer: {
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
    color: 'rgba(36, 44, 58, 0.7)',
    fontSize: 14,
  },
  headerFullNameText: {
    color: '#232B3A',
    fontSize: 20,
    fontWeight: '500',
  },
});
