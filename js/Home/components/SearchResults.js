import React from 'react';
import {
  ActivityIndicator,
  ListView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Colors from '../constants/Colors';
import Layout from '../constants/Layout';
import ProfileCard from '../components/ProfileCard';
import ProjectCard from '../components/ProjectCard';
import SharedStyles from '../constants/SharedStyles';

const SectionIds = [
  'UserSearchResult',
  'AppSearchResult',
];

export default class SearchResults extends React.Component {
  state = {
    dataSource: new ListView.DataSource({
      sectionHeaderHasChanged: (s1, s2) => s1 !== s2,
      rowHasChanged: (r1, r2) => r1 !== r2,
    }),
  }

  componentWillMount() {
    this._maybeUpdateDataSource(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this._maybeUpdateDataSource(nextProps);
  }

  _maybeUpdateDataSource = (newProps) => {
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
  }

  render() {
    return (
      <View style={{flex: 1}}>
        {this._renderContent()}
        {this._maybeRenderLoading()}
      </View>
    );
  }

  _maybeRenderLoading = () => {
    if (this.props.data.loading) {
      return (
        <View style={[StyleSheet.absoluteFill, {padding: 30, alignItems: 'center'}]} pointerEvents="none">
          <ActivityIndicator />
        </View>
      );
    }
  }

  _renderContent = () => {
    return (
      <ListView
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        dataSource={this.state.dataSource}
        renderRow={this._renderRow}
        renderSectionHeader={this._renderSectionHeader}
        contentContainerStyle={{paddingTop: 5, paddingBottom: 15}}
        style={{flex: 1, backgroundColor: Colors.greyBackground}}
      />
    );
  }

  _renderSectionHeader = (sectionData, sectionId) => {
    return (
      <View style={[SharedStyles.sectionLabelContainer, {backgroundColor: Colors.greyBackground}]}>
        <Text style={SharedStyles.sectionLabelText}>
          {sectionId === 'AppSearchResult' ? 'PROJECTS' : 'PEOPLE'}
        </Text>
      </View>
    );
  }

  _isLastAppSearchResult = (index) => {
    let appSectionIdx = SectionIds.indexOf('AppSearchResult');
    let appSectionLength = this.state.dataSource.getSectionLengths()[appSectionIdx];
    return parseInt(index, 0) + 1 === appSectionLength;
  }

  _isLastUserSearchResult = (index) => {
    let userSectionIdx = SectionIds.indexOf('UserSearchResult');
    let userSectionLength = this.state.dataSource.getSectionLengths()[userSectionIdx];
    return parseInt(index, 0) + 1 === userSectionLength;
  }

  _renderRow = (rowData, sectionId, rowId) => {
    if (sectionId === 'AppSearchResult') {
      let { app } = rowData;

      return (
        <ProjectCard
          style={{marginBottom: this._isLastAppSearchResult(rowId) ? 0 : 15}}
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
          style={{marginBottom: this._isLastUserSearchResult(rowId) ? 7 : 0}}
          fullName={user.fullName}
          username={user.username}
          appCount={user.appCount}
          profilePhoto={user.profilePhoto}
          isLegacy={user.isLegacy}
        />
      );
    }
  }
}

