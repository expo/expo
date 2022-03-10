import { Divider, View } from 'expo-dev-client-components';
import React, { Fragment } from 'react';
import { Linking } from 'react-native';

import { HistoryList } from '../../types';
import { RecentlyOpenedListItem } from './RecentlyOpenedListItem';

type Props = {
  recentHistory: HistoryList;
};

export function RecentlyOpenedSection({ recentHistory }: Props) {
  return (
    <View border="hairline" bg="default" overflow="hidden" rounded="large">
      {recentHistory.map((project, i) => {
        if (!project) return null;

        return (
          <Fragment key={project.manifestUrl}>
            <RecentlyOpenedListItem
              url={project.manifestUrl}
              image={
                // TODO(wschurman): audit for new manifests
                project.manifest && 'iconUrl' in project.manifest
                  ? project.manifest.iconUrl
                  : undefined
              }
              title={
                // TODO(wschurman): audit for new manifests
                project.manifest && 'name' in project.manifest ? project.manifest.name : undefined
              }
              onPress={() => {
                // TODO(fiberjw): navigate to the project details screen
                Linking.openURL(project.url);
              }}
            />
            {i < recentHistory.count() - 1 && <Divider />}
          </Fragment>
        );
      })}
    </View>
  );
}
