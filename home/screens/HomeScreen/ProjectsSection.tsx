import { ChevronDownIcon } from '@expo/styleguide-native';
import { PressableOpacity } from 'components/PressableOpacity';
import { Divider, Row, useExpoTheme, View, Text } from 'expo-dev-client-components';
import { CommonAppDataFragment } from 'graphql/types';
import React, { Fragment } from 'react';

import { ProjectsListItem } from './ProjectsListItem';

type Props = {
  apps: CommonAppDataFragment[];
  showMore: boolean;
};

export function ProjectsSection({ apps, showMore }: Props) {
  const theme = useExpoTheme();

  function onSeeAllProjectsPress() {
    // TODO(fiberjw): navigate to the projects list page
    console.log('onSeeAllProjectsPress');
  }

  return (
    <View bg="default" rounded="large" style={{ overflow: 'hidden' }}>
      {apps.map((project, i) => {
        if (!project) return null;

        return (
          <Fragment key={project.id}>
            <ProjectsListItem
              // iconUrl will be an empty string if the project has no icon
              imageURL={project.iconUrl || undefined}
              name={project.name}
              onPress={() => {
                // TODO(fiberjw): navigate to the project details screen
              }}
            />
            {i < apps.length - 1 && <Divider />}
          </Fragment>
        );
      })}
      {showMore && (
        <>
          <Divider />
          <PressableOpacity onPress={onSeeAllProjectsPress}>
            <View padding="medium">
              <Row align="center" justify="between">
                <Text>See all projects</Text>
                <ChevronDownIcon
                  style={{ transform: [{ rotate: '-90deg' }] }}
                  color={theme.icon.secondary}
                />
              </Row>
            </View>
          </PressableOpacity>
        </>
      )}
    </View>
  );
}
