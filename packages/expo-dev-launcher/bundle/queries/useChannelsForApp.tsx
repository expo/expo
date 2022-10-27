import { gql } from 'graphql-request';
import * as React from 'react';
import { useQuery } from 'react-query';

import { apiClient } from '../apiClient';
import { Toasts } from '../components/Toasts';
import { useToastStack } from '../providers/ToastStackProvider';

const query = gql`
  query getUpdates($appId: String!) {
    app {
      byId(appId: $appId) {
        updateChannels(offset: 0, limit: 10) {
          name
          updateBranches(offset: 0, limit: 10) {
            name
          }
        }
      }
    }
  }
`;

export type Channel = {
  name: string;
  branches: string[]; // branchNames
};

function getChannelsAsync(appId: string) {
  const variables = { appId };

  return apiClient.request(query, variables).then((response) => {
    const updateChannels = response.app.byId.updateChannels;

    const channels: Channel[] = [];

    updateChannels.forEach((updateChannel) => {
      const channel: Channel = {
        name: updateChannel.name,
        branches: updateChannel.updateBranches.map((branch) => branch.name),
      };

      channels.push(channel);
    });

    return channels;
  });
}

export function useChannelsForApp(appId: string) {
  const toastStack = useToastStack();

  const query = useQuery(['channels', appId], () => getChannelsAsync(appId));

  React.useEffect(() => {
    if (query.error && toastStack.getItems().length === 0) {
      toastStack.push(() => (
        <Toasts.Error>
          Something went wrong trying to find the channels for this branch.
        </Toasts.Error>
      ));
    }
  }, [query.error]);

  return query;
}
