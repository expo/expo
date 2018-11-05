/* @flow */

import React from 'react';
import {
  ActivityIndicator,
  Keyboard,
  ListView,
  Linking,
  NativeModules,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import TouchableNativeFeedbackSafe from '@expo/react-native-touchable-native-feedback-safe';

import Colors from '../constants/Colors';
import ProfileCard from '../components/ProfileCard';
import ProjectCard from '../components/ProjectCard';
import SharedStyles from '../constants/SharedStyles';
import UrlUtils from '../utils/UrlUtils';

let { ExponentKernel } = NativeModules;

const SectionIds = ['UserSearchResult', 'AppSearchResult'];

export default class SearchResults extends React.Component {
  state = {
    dataSource: new ListView.DataSource({
      sectionHeaderHasChanged: (s1, s2) => s1 !== s2,
      rowHasChanged: (r1, r2) => r1 !== r2,
      lastQueryHadNoResults: false,
    }),
  };

  componentWillMount() {
    this._maybeUpdateDataSource(this.props);
  }

  componentWillReceiveProps(nextProps: Object) {
    this._maybeUpdateDataSource(nextProps);
  }

  render() {
    return (
      <View style={{ flex: 1 }}>
        {this._renderContent()}
        {this._maybeRenderLoading()}
      </View>
    );
  }

  _maybeUpdateDataSource = (newProps: Object) => {
    if (!newProps.data) {
      return;
    }

    if (newProps.data.results !== this.props.data.results) {
      let { dataSource } = this.state;
      let { results } = newProps.data;
      let populatedSectionIds = [];

      results = results || {};

      if (results.UserSearchResult) {
        populatedSectionIds = populatedSectionIds.concat('UserSearchResult');
      }

      if (results.AppSearchResult) {
        populatedSectionIds = populatedSectionIds.concat('AppSearchResult');
      }

      let newDataSource = dataSource.cloneWithRowsAndSections(results, populatedSectionIds);

      this.setState({ dataSource: newDataSource });
    }
  };

  _isLoading = () => {
    return this.props.data && this.props.data.loading;
  };

  _maybeRenderLoading = () => {
    if (this._isLoading() && this.props.query.length > 0) {
      return (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              padding: 30,
              alignItems: 'center',
              backgroundColor: Colors.greyBackground,
            },
          ]}
          pointerEvents="none">
          <ActivityIndicator />
        </View>
      );
    }
  };

  _renderContent = () => {
    if (
      this.state.dataSource.getRowCount() === 0 &&
      !this._isLoading() &&
      this.props.query.length >= 1
    ) {
      return (
        <ScrollView
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="on-drag"
          style={styles.scrollContainer}>
          <View
            style={[
              SharedStyles.sectionLabelContainer,
              { backgroundColor: Colors.greyBackground, marginTop: 7 },
            ]}>
            <Text style={SharedStyles.sectionLabelText}>NO RESULTS FOUND</Text>
          </View>

          <TouchableNativeFeedbackSafe
            onPress={this._handleOpenUrl}
            fallback={TouchableHighlight}
            underlayColor="#b7b7b7"
            style={styles.cardContainer}>
            <Text style={styles.cardTitleText}>Tap to attempt to open project at</Text>
            <Text style={styles.urlText}>{this.props.query}</Text>
          </TouchableNativeFeedbackSafe>
        </ScrollView>
      );
    } else {
      return (
        <ListView
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="on-drag"
          dataSource={this.state.dataSource}
          renderRow={this._renderRow}
          renderSectionHeader={this._renderSectionHeader}
          contentContainerStyle={{ paddingTop: 5, paddingBottom: 15 }}
          style={{ flex: 1, backgroundColor: Colors.greyBackground }}
        />
      );
    }
  };

  _handleOpenUrl = () => {
    Keyboard.dismiss();
    let url = UrlUtils.normalizeUrl(this.props.query);
    if (ExponentKernel && ExponentKernel.openURL) {
      // ExponentKernel.openURL exists on iOS, and it's the same as Linking.openURL
      // except it will never validate whether Exponent can open this url.
      // this addresses cases where, e.g., someone types in a http://localhost url directly into
      // the URL bar. we know they implicitly expect Exponent to open this, even though
      // it won't validate as an Exponent url.
      // By contrast, Linking.openURL would pass such a URL on to the system url handler.
      ExponentKernel.openURL(url);
    } else {
      Linking.openURL(url);
    }
  };

  _renderSectionHeader = (sectionData: Object, sectionId: string) => {
    return (
      <View
        key={sectionData}
        style={[SharedStyles.sectionLabelContainer, { backgroundColor: Colors.greyBackground }]}>
        <Text style={SharedStyles.sectionLabelText}>
          {sectionId === 'AppSearchResult' ? 'PROJECTS' : 'PEOPLE'}
        </Text>
      </View>
    );
  };

  _isLastAppSearchResult = (index: number) => {
    let appSectionIdx = SectionIds.indexOf('AppSearchResult');
    let appSectionLength = this.state.dataSource.getSectionLengths()[appSectionIdx];
    return parseInt(index, 0) + 1 === appSectionLength;
  };

  _isLastUserSearchResult = (index: number) => {
    let userSectionIdx = SectionIds.indexOf('UserSearchResult');
    let userSectionLength = this.state.dataSource.getSectionLengths()[userSectionIdx];
    return parseInt(index, 0) + 1 === userSectionLength;
  };

  _renderRow = (rowData: Object, sectionId: string, rowId: number) => {
    if (sectionId === 'AppSearchResult') {
      let { app } = rowData;

      return (
        <ProjectCard
          style={{ marginBottom: this._isLastAppSearchResult(rowId) ? 0 : 15 }}
          isLikedByMe={app.isLikedByMe}
          likeCount={app.likeCount}
          id={app.id}
          iconUrl={app.iconUrl}
          projectName={app.name}
          projectUrl={app.fullName}
          username={app.packageUsername}
          description={app.description}
        />
      );
    } else if (sectionId === 'UserSearchResult') {
      let { user } = rowData;

      return (
        <ProfileCard
          style={{ marginBottom: this._isLastUserSearchResult(rowId) ? 7 : 0 }}
          fullName={user.fullName}
          username={user.username}
          appCount={user.appCount}
          profilePhoto={user.profilePhoto}
          isLegacy={user.isLegacy}
        />
      );
    }
  };
}

const styles = StyleSheet.create({
  scrollContainer: {
    backgroundColor: Colors.greyBackground,
    flex: 1,
  },
  cardContainer: {
    backgroundColor: '#fff',
    flexGrow: 1,
    borderBottomColor: Colors.separator,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    padding: 13,
  },
  cardTitleText: {
    color: Colors.blackText,
    fontSize: 15,
    marginBottom: 2,
    ...Platform.select({
      ios: {
        fontWeight: '500',
      },
      android: {
        fontWeight: '400',
        marginTop: 1,
      },
    }),
  },
  urlText: {
    color: 'rgba(36, 44, 58, 0.4)',
    fontSize: 13,
    lineHeight: 16,
  },
});
