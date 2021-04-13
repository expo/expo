import { useNavigation } from '@react-navigation/native';
import * as React from 'react';
import { Linking, ScrollView, StatusBar, StyleSheet, View } from 'react-native';

import ListItem from '../components/ListItem';
import { StyledBlurView, StyledView } from '../components/Views';
import * as UrlUtils from '../utils/UrlUtils';
import CloseButton from './CloseButton';
import SectionHeader from './SectionHeader';
import { StyledText } from './Text';

type Props = {
  legacyManifestFullName?: string;
  branchManifests?: { branchName: string; manifestUrl: string }[];
};

export default function ProjectManifestLauncher(props: Props) {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" />
      <StyledBlurView style={{ flex: 1 }}>
        <Header />
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }} style={styles.container}>
          {props.legacyManifestFullName && (
            <LegacyManifestSection legacyManifestFullName={props.legacyManifestFullName} />
          )}
          {props.branchManifests && props.branchManifests.length > 0 && (
            <NewManifestSection branchManifests={props.branchManifests} />
          )}
        </ScrollView>
      </StyledBlurView>
    </>
  );
}

function Header() {
  return (
    <StyledView style={styles.header} darkBackgroundColor="#000" darkBorderColor="#000">
      <CloseButton style={styles.closeButton} />
      <StyledText style={styles.headerFullNameText}>Select a release channel or branch</StyledText>
    </StyledView>
  );
}

function LegacyManifestSection(props: { legacyManifestFullName: string }) {
  const navigation = useNavigation();
  return (
    <ListItem
      key="legacy-manifest"
      title="Use Classic Updates"
      onPress={() => {
        navigation.goBack();
        Linking.openURL(UrlUtils.normalizeUrl(props.legacyManifestFullName));
      }}
      last
    />
  );
}

function NewManifestSection(props: {
  branchManifests: { branchName: string; manifestUrl: string }[];
}) {
  const navigation = useNavigation();
  const renderBranchManifest = (
    branchManifest: { branchName: string; manifestUrl: string },
    index: number
  ) => {
    return (
      <ListItem
        key={`branch-${branchManifest.branchName}`}
        title={branchManifest.branchName}
        onPress={() => {
          navigation.goBack();
          Linking.openURL(UrlUtils.toExps(branchManifest.manifestUrl));
        }}
        last={index === props.branchManifests.length - 1}
      />
    );
  };

  return (
    <View>
      <SectionHeader title="EAS Update branches" />
      {props.branchManifests.map(renderBranchManifest)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: -1,
  },
  header: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
    marginRight: 10,
    marginLeft: 5,
    marginBottom: 5,
  },
  headerFullNameText: {
    fontSize: 20,
    fontWeight: '500',
    margin: 15,
  },
});
