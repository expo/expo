import React from 'react';
import {
  ActivityIndicator,
  Keyboard,
  SectionList,
  Platform,
  StyleSheet,
  TouchableHighlight,
  View,
} from 'react-native';

import ProfileCard from '../components/ProfileCard';
import ProjectCard from '../components/ProjectCard';
import Colors from '../constants/Colors';
import * as Kernel from '../kernel/Kernel';
import UrlUtils from '../utils/UrlUtils';
import { StyledText, SectionLabelText } from './Text';
import {
  GenericCardContainer,
  StyledScrollView,
  SectionLabelContainer,
  StyledView,
  StyledButton,
} from './Views';

const SectionIds = ['UserSearchResult', 'AppSearchResult'];

export default class SearchResults extends React.Component {
  state = {
    sections: [],
  };

  componentDidMount() {
    this._maybeUpdateSections(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this._maybeUpdateSections(nextProps);
  }

  render() {
    return (
      <View style={{ flex: 1 }}>
        {this._renderContent()}
        {this._maybeRenderLoading()}
      </View>
    );
  }

  _maybeUpdateSections = newProps => {
    if (!newProps.data) {
      return;
    }

    if (newProps.data.results !== this.props.data.results) {
      let results = newProps.data?.results || {};

      let sections = [];
      Object.keys(results).forEach(key => {
        sections.push({ title: key, data: results[key] });
      });

      // note(brentvatne):
      // Filter out Snack search results until this is supported
      sections = sections.filter(section => SectionIds.includes(section.title));

      this.setState({ sections });
    }
  };

  _isLoading = () => {
    return this.props.data && this.props.data.loading;
  };

  _maybeRenderLoading = () => {
    if (this._isLoading() && this.props.query.length > 0) {
      return (
        <StyledView
          lightBackgroundColor={Colors.light.greyBackground}
          darkBackgroundColor="#000"
          style={[
            StyleSheet.absoluteFill,
            {
              padding: 30,
              alignItems: 'center',
            },
          ]}
          pointerEvents="none">
          <ActivityIndicator color={Colors.light.tintColor} />
        </StyledView>
      );
    }
  };

  _renderContent = () => {
    if (this.state.sections.length === 0 && !this._isLoading() && this.props.query.length >= 1) {
      return (
        <StyledScrollView
          lightBackgroundColor={Colors.light.greyBackground}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="on-drag"
          style={styles.scrollContainer}>
          <SectionLabelContainer style={{ marginTop: 7 }}>
            <SectionLabelText>NO RESULTS FOUND</SectionLabelText>
          </SectionLabelContainer>

          <GenericCardContainer style={styles.cardContainer}>
            <StyledButton
              onPress={this._handleOpenUrl}
              fallback={TouchableHighlight}
              foreground
              style={styles.button}
              underlayColor="#b7b7b7">
              <StyledText style={styles.cardTitleText}>
                Tap to attempt to open project at
              </StyledText>
              <StyledText
                style={styles.urlText}
                lightColor="rgba(36, 44, 58, 0.4)"
                darkColor="#888">
                {this.props.query}
              </StyledText>
            </StyledButton>
          </GenericCardContainer>
        </StyledScrollView>
      );
    } else {
      return (
        <SectionList
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="on-drag"
          keyExtractor={item => item.id}
          sections={this.state.sections}
          renderItem={this._renderItem}
          renderScrollComponent={props => (
            <StyledScrollView {...props} lightBackgroundColor={Colors.light.greyBackground} />
          )}
          renderSectionHeader={this._renderSectionHeader}
          contentContainerStyle={{ paddingTop: 5, paddingBottom: 15 }}
          style={{ flex: 1 }}
        />
      );
    }
  };

  _handleOpenUrl = () => {
    Keyboard.dismiss();
    let url = UrlUtils.normalizeUrl(this.props.query);
    Kernel.openURLAsync(url);
  };

  _renderSectionHeader = ({ section }) => {
    let title;
    if (section.title === 'AppSearchResult') {
      title = 'PROJECTS';
    } else {
      title = 'PEOPLE';
    }

    return (
      <SectionLabelContainer key={section}>
        <SectionLabelText>{title}</SectionLabelText>
      </SectionLabelContainer>
    );
  };

  _renderItem = ({ item, index, section }) => {
    let isLastItem = index === section.data.length - 1;
    if (section.title === 'AppSearchResult') {
      let { app } = item;

      return (
        <ProjectCard
          style={{ marginBottom: isLastItem ? 15 : 0 }}
          id={app.id}
          iconUrl={app.iconUrl}
          projectName={app.name}
          projectUrl={app.fullName}
          username={app.packageUsername}
          description={app.description}
        />
      );
    } else if (section.title === 'UserSearchResult') {
      let { user } = item;

      return (
        <ProfileCard
          style={{ marginBottom: isLastItem ? 7 : 0 }}
          fullName={user.fullName}
          username={user.username}
          appCount={user.appCount}
          profilePhoto={user.profilePhoto}
          isLegacy={user.isLegacy}
        />
      );
    } else {
      return <StyledText>{section.title}</StyledText>;
    }
  };
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  cardContainer: {
    flexGrow: 1,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
  },
  button: {
    backgroundColor: 'transparent',
    padding: 13,
  },
  cardTitleText: {
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
    fontSize: 13,
    lineHeight: 16,
  },
});
