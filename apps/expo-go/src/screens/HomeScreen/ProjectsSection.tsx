import { ChevronDownIcon } from '@expo/styleguide-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Divider, Row, useExpoTheme, View, Text } from 'expo-dev-client-components';
import React, { Fragment } from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { ProjectsListItem } from '../../components/ProjectsListItem';
import { CommonAppDataFragment } from '../../graphql/types';
import { HomeStackRoutes } from '../../navigation/Navigation.types';

type Props = {
  apps: CommonAppDataFragment[];
  showMore: boolean;
  accountName: string;
};

export function ProjectsSection({ apps, showMore, accountName }: Props) {
  const theme = useExpoTheme();
  const navigation = useNavigation<StackNavigationProp<HomeStackRoutes>>();

  function onSeeAllProjectsPress() {
    navigation.push('ProjectsList', { accountName });
  }

  return (
    <View>
      {apps.map((project, i) => {
        if (!project) return null;

        return (
          <Fragment key={project.id}>
            <ProjectsListItem
              id={project.id}
              name={project.name}
              firstTwoBranches={project.firstTwoBranches}
              subtitle={project.fullName}
              first={i === 0}
              last={i === apps.length - 1 && !showMore}
            />
            {i < apps.length - 1 && <Divider style={{ height: 1 }} />}
          </Fragment>
        );
      })}
      {showMore && (
        <View border="default" roundedBottom="large">
          <TouchableOpacity onPress={onSeeAllProjectsPress}>
            <View padding="medium" bg="default" roundedBottom="large">
              <Row align="center" justify="between">
                <Text type="InterRegular">See all projects</Text>
                <ChevronDownIcon
                  style={{ transform: [{ rotate: '-90deg' }] }}
                  color={theme.icon.secondary}
                />
              </Row>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
