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
import TouchableNativeFeedbackSafe
  from '@exponent/react-native-touchable-native-feedback-safe';

import Colors from '../constants/Colors';
import ExUrls from 'ExUrls';
import Layout from '../constants/Layout';
import ProfileCard from '../components/ProfileCard';
import ProjectCard from '../components/ProjectCard';
import SharedStyles from '../constants/SharedStyles';

let { ExponentKernel } = NativeModules;

const SectionIds = ['UserSearchResult', 'AppSearchResult'];

function resultsAreEmpty(results) {
  if (!results) {
    return true;
  }

  if (!results.UserSearchResult && !results.AppSearchResult) {
    return true;
  }

  return false;
}

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

  componentWillReceiveProps(nextProps) {
    this._maybeSetPreviousQueryNoResults(nextProps);
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

  // PLEASE DO NOT MAKE FUN OF ME :<
  // I will improve this soon - Brent
  _maybeSetPreviousQueryNoResults = newProps => {
    if (newProps.query.length < 2) {
      if (this.state.lastQueryHadNoResults) {
        this.setState({ lastQueryHadNoResults: false });
      }

      return;
    }

    if (!this.props.data.loading && this.props.query.length < 2) {
      return;
    }

    if (newProps.loading) {
      return;
    }

    if (resultsAreEmpty(newProps.results)) {
      if (!this.state.lastQueryHadNoResults) {
        this.setState({ lastQueryHadNoResults: true });
      }
    } else {
      if (this.state.lastQueryHadNoResults) {
        this.setState({ lastQueryHadNoResults: false });
      }
    }
  };

  _maybeUpdateDataSource = newProps => {
    if (newProps.data.results !== this.props.data.results) {
      let { dataSource } = this.state;
      let { results } = newProps.data;
      results = results || {};
      results.UserSearchResult = results.UserSearchResult || [];
      results.AppSearchResult = results.AppSearchResult || [];

      let newDataSource = dataSource.cloneWithRowsAndSections(
        results,
        SectionIds,
      );

      this.setState({ dataSource: newDataSource });
    }
  };

  _maybeRenderLoading = () => {
    // if (this.props.data.loading) {
    //   return (
    //     <View style={[StyleSheet.absoluteFill, {padding: 30, alignItems: 'center'}]} pointerEvents="none">
    //       <ActivityIndicator />
    //     </View>
    //   );
    // }
  };

  _renderContent = () => {
    if (
      this.state.dataSource.getRowCount() === 0 &&
      (!this.props.data.loading || this.state.lastQueryHadNoResults) &&
      this.props.query.length >= 2
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
            <Text style={SharedStyles.sectionLabelText}>
              NO RESULTS FOUND
            </Text>
          </View>

          <TouchableNativeFeedbackSafe
            onPress={this._handleOpenUrl}
            fallback={TouchableHighlight}
            underlayColor="#b7b7b7"
            style={styles.cardContainer}>
            <Text style={styles.cardTitleText}>
              Tap to attempt to open project at
            </Text>
            <Text style={styles.urlText}>
              {this.props.query}
            </Text>
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
    let url = ExUrls.normalizeUrl(this.props.query);
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

  _renderSectionHeader = (sectionData, sectionId) => {
    return (
      <View
        style={[
          SharedStyles.sectionLabelContainer,
          { backgroundColor: Colors.greyBackground },
        ]}>
        <Text style={SharedStyles.sectionLabelText}>
          {sectionId === 'AppSearchResult' ? 'PROJECTS' : 'PEOPLE'}
        </Text>
      </View>
    );
  };

  _isLastAppSearchResult = index => {
    let appSectionIdx = SectionIds.indexOf('AppSearchResult');
    let appSectionLength = this.state.dataSource.getSectionLengths()[
      appSectionIdx
    ];
    return parseInt(index, 0) + 1 === appSectionLength;
  };

  _isLastUserSearchResult = index => {
    let userSectionIdx = SectionIds.indexOf('UserSearchResult');
    let userSectionLength = this.state.dataSource.getSectionLengths()[
      userSectionIdx
    ];
    return parseInt(index, 0) + 1 === userSectionLength;
  };

  _renderRow = (rowData, sectionId, rowId) => {
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
