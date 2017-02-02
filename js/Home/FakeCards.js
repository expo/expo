import React from 'react';
import { View } from 'react-native';
import ProjectCard from './components/ProjectCard';

export default class FakeCards extends React.Component {
  shouldComponentUpdate() {
    return false;
  }

  render() {
    return (
      <View>
        <ProjectCard
          key="1"
          iconUrl="https://s3.amazonaws.com/exp-brand-assets/ExponentEmptyManifest_192.png"
          projectName="Native Component List"
          username="@notbrent"
          description="A simple prototype of the launchscreen commonly seen on Android phones"
        />
        <ProjectCard
          key="2"
          iconUrl="http://url.brentvatne.ca/oERM.png"
          projectName="Navigation"
          username="@example"
          description="A Github feed that displays all the newly created repositories, comments on your own issues, new commits, et cetera."
        />
        <ProjectCard
          key="3"
          iconUrl="https://s3-us-west-2.amazonaws.com/examples-exp/floaty_icon.png"
          projectName="Floaty Plane"
          username="@nikki"
          description="A version of our iOS app built on Exponent for experimentation purposes."
          liked
        />
        <ProjectCard
          key="4"
          iconUrl="http://url.brentvatne.ca/oERM.png"
          projectName="Navigation"
          username="@example"
          description="A Github feed that displays all the newly created repositories, comments on your own issues, new commits, et cetera."
        />
        <ProjectCard
          key="5"
          iconUrl="https://s3.amazonaws.com/exp-brand-assets/ExponentEmptyManifest_192.png"
          projectName="Native Component List"
          username="@notbrent"
          description="A simple prototype of the launchscreen commonly seen on Android phones"
        />
      </View>
    );
  }
}
