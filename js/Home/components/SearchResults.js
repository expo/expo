import React from 'react';
import {
  ListView,
  Text,
  View,
} from 'react-native';

import Colors from '../constants/Colors';
import Layout from '../constants/Layout';
import ProfileCard from '../components/ProfileCard';
import ProjectCard from '../components/ProjectCard';
import SharedStyles from '../constants/SharedStyles';

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
        ['UserSearchResult', 'AppSearchResult'],
      );

      this.setState({ dataSource: newDataSource });
    }
  }

  render() {
    return (
      <View style={{flex: 1}}>
        {this._renderContent()}
        {false && this.props.data.loading && <Text>Loading!</Text>}
      </View>
    );
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
    return parseInt(index, 0) + 1 === this.state.dataSource.getSectionLengths()[1];
  }

  _isLastUserSearchResult = (index) => {
    return parseInt(index, 0) + 1 === this.state.dataSource.getSectionLengths()[0];
  }

  _renderRow = (rowData, sectionId, rowId) => {
    if (sectionId === 'AppSearchResult') {
      let { app } = rowData;

      return (
        <ProjectCard
          style={{marginBottom: this._isLastAppSearchResult(rowId) ? 5 : 15}}
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

