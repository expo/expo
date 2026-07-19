import { graphql, query } from '../client';

export type App = {
  id: string;
  scopeKey: string;
  ownerAccount: {
    id: string;
    name: string;
  };
};

type AppQueryData = {
  app: {
    byId: App;
  };
};

type AppQueryVariables = {
  appId: string;
};

const AppQueryDocument = graphql<AppQueryData, AppQueryVariables>(`
  query AppByIdQuery($appId: String!) {
    app {
      byId(appId: $appId) {
        id
        ...AppFragment
      }
    }
  }

  fragment AppFragment on App {
    id
    scopeKey
    ownerAccount {
      id
      name
    }
  }
`);

export const AppQuery = {
  async byIdAsync(projectId: string): Promise<AppQueryData['app']['byId']> {
    const data = await query(AppQueryDocument, { appId: projectId });
    return data.app.byId;
  },
};
