import React from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
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

import SeeAllProjectsButton from './SeeAllProjectsButton';
import SmallProjectCard from './SmallProjectCard';
import SharedStyles from '../constants/SharedStyles';
import Colors from '../constants/Colors';
import FakeCards from '../FakeCards';
import StyledSlidingTabNavigation from '../navigation/StyledSlidingTabNavigation';

const MAX_APPS_TO_DISPLAY = 3;
const MAX_LIKES_TO_DISPLAY = 3;

export default class Profile extends React.Component {
  render() {
    return (
      <ScrollView style={styles.container}>
        {this._renderHeader()}
        {this._renderApps()}
      </ScrollView>
    );
  }

  _renderHeader = () => {
    if (this.props.data.loading && !this.props.data.user) {
      return (
        <View style={{flex: 1, padding: 30, alignItems: 'center'}}>
          <ActivityIndicator />
        </View>
      );
    }

    if (!this.props.data.user) {
      return;
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

  _renderApps = () => {
    if (!this.props.data.user) {
      return;
    }

    let { apps } = this.props.data.user;

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
          <SeeAllProjectsButton label="See all projects" apps={otherApps} />
        </View>
      );
    }
  }



  _renderApp = (app, i) => {
    return (
      <SmallProjectCard
        key={i}
        iconUrl={app.iconUrl}
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
