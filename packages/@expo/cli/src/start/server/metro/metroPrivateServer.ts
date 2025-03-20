import type {
  default as MetroHmrServer,
  Client as MetroHmrClient,
} from '@bycedric/metro/metro/HmrServer';
import type MetroServer from '@bycedric/metro/metro/Server';
import type createModuleIdFactory from '@bycedric/metro/metro/lib/createModuleIdFactory';
import type { createStableModuleIdFactory } from '@expo/metro-config';
import assert from 'node:assert';

type ExpoModuleIdFactory =
  | ReturnType<typeof createStableModuleIdFactory>
  | ReturnType<typeof createModuleIdFactory>;

interface MetroPrivateServerOverrides {
  _createModuleId: ExpoModuleIdFactory;
  getCreateModuleId(): ExpoModuleIdFactory;
}

export interface MetroPrivateServer
  extends MetroPrivateServerOverrides,
    Omit<MetroServer, keyof MetroPrivateServerOverrides> {}

export function assertMetroPrivateServer(metro: unknown): asserts metro is MetroPrivateServer {
  assert(metro, 'Metro server undefined.');
  assert(
    typeof metro === 'object' && '_config' in metro && '_bundler' in metro,
    'Metro server is missing expected properties (_config, _bundler). This could be due to a version mismatch or change in the Metro API.'
  );
}

interface MetroPrivateHmrServerOverrides {
  _createModuleId: ExpoModuleIdFactory;
}

export interface MetroPrivateHmrServer<TClient extends MetroHmrClient = any>
  extends MetroPrivateHmrServerOverrides,
    Omit<MetroHmrServer<TClient>, keyof MetroPrivateHmrServerOverrides> {}
