import { print } from 'graphql';
import gql from 'graphql-tag';

import { AppByIdQuery } from '../../../graphql/generated';
import { graphqlClient, withErrorHandlingAsync } from '../client';
import { AppFragmentNode } from '../types/App';

export const AppQuery = {
  async byIdAsync(projectId: string): Promise<AppByIdQuery['app']['byId']> {
    const data = await withErrorHandlingAsync(
      graphqlClient
        .query<AppByIdQuery>(
          gql`
            query AppByIdQuery($appId: String!) {
              app {
                byId(appId: $appId) {
                  id
                  ...AppFragment
                }
              }
            }
            ${print(AppFragmentNode)}
          `,
          { appId: projectId },
          {
            additionalTypenames: ['App'],
          }
        )
        .toPromise()
    );
    return data.app.byId;
  },
};
