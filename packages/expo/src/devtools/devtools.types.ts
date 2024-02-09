/**
 * The connection info for devtools plugins client.
 */
export interface ConnectionInfo {
  /** Indicates the sender towards the devtools plugin. */
  sender:
    | 'app' // client running in the app environment.
    | 'browser'; // client running in the browser environment.

  /** Dev server address. */
  devServer: string;

  /** The plugin name. */
  pluginName: string;
}

/**
 * Parameters for the `handshake` message.
 * @hidden
 */
export interface HandshakeMessageParams {
  browserClientId: string;
  pluginName: string;
}
