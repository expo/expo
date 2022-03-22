import { gql } from 'graphql-request';
import { useQuery } from 'react-query';

import { apiClient } from '../apiClient';

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
  return useQuery(['channels', appId], () => getChannelsAsync(appId));
}
