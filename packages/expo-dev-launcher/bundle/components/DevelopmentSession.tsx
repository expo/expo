import React from 'react';
import { View, Text, StyleSheet, Share } from 'react-native';

import ListItem from './ListItem';

type Project = {
  description: string;
  source: 'snack' | 'desktop';
  url: string;
};

type Props = {
  projects: Project[];
  projectLoader: (project: Project) => void;
};

const Project = ({
  project,
  projectLoader,
}: {
  project: Project;
  projectLoader: (project: Project) => void;
}) => (
  <ListItem
    title={project.description}
    onPress={() => projectLoader(project)}
    onLongPress={() => {
      const message = project.url;
      Share.share({
        title: message,
        message,
        url: message,
      });
    }}
  />
);

const DevelopmentSessions = ({ projects, projectLoader }: Props) => {
  // We're temporarily skipping snack projects
  projects = projects?.filter(project => project.source !== 'snack');

  if (!projects || projects.length === 0) {
    return null;
  }

  return (
    <View>
      <Text style={styles.infoText}>Recently in development</Text>
      {projects.map(project => (
        <Project key={project.url} project={project} projectLoader={projectLoader} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  infoText: {
    fontSize: 16,
    marginBottom: 10,
  },
});

export default DevelopmentSessions;
