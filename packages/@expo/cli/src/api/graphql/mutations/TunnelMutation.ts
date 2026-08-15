import { graphql, mutate } from '../client';

export type SignedTunnelUrl = {
  /** The unique tunnel label, used as the hostname segment of the tunnel URL. */
  label: string;
  /** The signed tunnel URL `@expo/ws-tunnel` connects to. */
  url: string;
};

type CreateSignedTunnelUrlData = {
  tunnels: {
    createSignedTunnelUrl: SignedTunnelUrl;
  };
};

type CreateSignedTunnelUrlVariables = {
  accountId: string;
};

const CreateSignedTunnelUrlDocument = graphql<
  CreateSignedTunnelUrlData,
  CreateSignedTunnelUrlVariables
>(`
  mutation CreateSignedTunnelUrl($accountId: ID!) {
    tunnels {
      createSignedTunnelUrl(accountId: $accountId) {
        label
        url
      }
    }
  }
`);

export const TunnelMutation = {
  async createSignedTunnelUrlAsync(accountId: string): Promise<SignedTunnelUrl> {
    const data = await mutate(CreateSignedTunnelUrlDocument, { accountId });
    return data.tunnels.createSignedTunnelUrl;
  },
};
