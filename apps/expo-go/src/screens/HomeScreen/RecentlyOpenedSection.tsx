import { Divider, View } from 'expo-dev-client-components';
import React, { Fragment } from 'react';
import { Linking } from 'react-native';

import { RecentlyOpenedListItem } from './RecentlyOpenedListItem';
import { HistoryList } from '../../types';

type Props = {
  recentHistory: HistoryList;
};

export function RecentlyOpenedSection({ recentHistory }: Props) {
  return (
    <View border="default" bg="default" overflow="hidden" rounded="large">
      {recentHistory.map((project, i) => {
        if (!project) return null;

        // EAS Update app names are under the extra.expoClient.name key
        const title =
          (project.manifest && 'extra' in project.manifest
            ? project.manifest.extra?.expoClient?.name
            : undefined) ??
          (project.manifest && 'name' in project.manifest
            ? String(project.manifest.name)
            : undefined);

        const iconUrl =
          project.manifest && 'extra' in project.manifest
            ? // @ts-expect-error iconUrl exists only for local development
              project.manifest?.extra?.expoClient?.iconUrl
            : undefined;

        return (
          <Fragment key={project.manifestUrl}>
            <RecentlyOpenedListItem
              url={project.manifestUrl}
              iconUrl={iconUrl}
              title={title}
              onPress={() => {
                Linking.openURL(project.url);
              }}
            />
            {i < recentHistory.count() - 1 && <Divider style={{ height: 1 }} />}
          </Fragment>
        );
      })}
    </View>
  );
}
