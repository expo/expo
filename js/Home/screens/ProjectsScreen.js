import React from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import AddProjectButton from '../components/AddProjectButton';
import Colors from '../constants/Colors';
import SharedStyles from '../constants/SharedStyles';
import FakeProjects from '../FakeProjects';
import SeeAllProjectsButton from '../components/SeeAllProjectsButton';
import SmallProjectCard from '../components/SmallProjectCard';

export default class HomeScreen extends React.Component {
  static route = {
    navigationBar: {
      title: 'Projects',
      renderRight: () => <AddProjectButton />,
    },
  }

  render() {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}>

          <View style={SharedStyles.sectionLabelContainer}>
            <View style={styles.greenDot} />
            <Text style={SharedStyles.sectionLabelText}>IN DEVELOPMENT</Text>
          </View>

          <SmallProjectCard
            iconUrl="https://s3.amazonaws.com/exp-brand-assets/ExponentEmptyManifest_192.png"
            projectName="Tab bar experiment"
            projectUrl="exp://m2-6dz.community.exponent-home.exp.direct:80"
            fullWidthBorder
          />

          <View style={[SharedStyles.sectionLabelContainer, styles.recentlyVisitedSectionLabelContainer]}>
            <Text style={SharedStyles.sectionLabelText}>RECENTLY VISITED</Text>
            <TouchableOpacity onPress={() => {}} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>CLEAR</Text>
            </TouchableOpacity>
          </View>

          <SmallProjectCard
            iconUrl="https://s3.amazonaws.com/exp-brand-assets/ExponentEmptyManifest_192.png"
            projectName="native-component-list"
            username="@notbrent"
          />
          <SmallProjectCard
            iconUrl="https://s3.amazonaws.com/exp-brand-assets/ExponentEmptyManifest_192.png"
            projectName="navigation"
            projectUrl="exp://8k-23z.community.exponent-home.exp.direct:80"
          />
          <SmallProjectCard
            iconUrl="https://s3-us-west-2.amazonaws.com/examples-exp/floaty_icon.png"
            projectName="Floaty Plane"
            username="@nikki"
            fullWidthBorder
          />

          <SeeAllProjectsButton
            onPress={() => {}}
            projects={FakeProjects}
          />
        </ScrollView>

        <StatusBar barStyle="default" />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.greyBackground,
  },
  contentContainer: {
    paddingTop: 10,
  },
  clearButton: {
    position: 'absolute',
    right: 15,
  },
  clearButtonText: {
    color: Colors.greyText,
    fontSize: 11,
    letterSpacing: 0.92,
    ...Platform.select({
      ios: {
        fontWeight: '500',
      },
    }),
  },
  greenDot: {
    backgroundColor: '#28ba20',
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 7,
  },
  recentlyVisitedSectionLabelContainer: {
    marginTop: 10,
  },
});
