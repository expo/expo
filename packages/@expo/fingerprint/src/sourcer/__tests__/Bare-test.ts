import spawnAsync from '@expo/spawn-async';
import fs from 'fs';
import { vol } from 'memfs';
import path from 'path';

import { normalizeOptionsAsync } from '../../Options';
import {
  getBareAndroidSourcesAsync,
  getBareIosSourcesAsync,
  getRncliAutolinkingSourcesAsync,
} from '../Bare';

jest.mock('@expo/spawn-async');
jest.mock('fs/promises');
jest.mock('/app/package.json', () => ({}), { virtual: true });

describe('getBareSourcesAsync', () => {
  afterEach(() => {
    vol.reset();
  });

  it('should contain android and ios folders in bare react-native project', async () => {
    vol.fromJSON(require('./fixtures/BareReactNative70Project.json'));
    let sources = await getBareAndroidSourcesAsync('/app', await normalizeOptionsAsync('/app'));
    expect(sources).toContainEqual(expect.objectContaining({ filePath: 'android', type: 'dir' }));

    sources = await getBareIosSourcesAsync('/app', await normalizeOptionsAsync('/app'));
    expect(sources).toContainEqual(expect.objectContaining({ filePath: 'ios', type: 'dir' }));
  });
});

describe(getRncliAutolinkingSourcesAsync, () => {
  afterEach(() => {
    vol.reset();
  });

  it('should contain rn-cli autolinking projects', async () => {
    const mockSpawnAsync = spawnAsync as jest.MockedFunction<typeof spawnAsync>;
    const fixture = fs.readFileSync(
      path.join(__dirname, 'fixtures', 'RncliAutoLinking.json'),
      'utf8'
    );
    mockSpawnAsync.mockResolvedValue({
      stdout: fixture,
      stderr: '',
      status: 0,
      signal: null,
      output: [fixture, ''],
    });
    const sources = await getRncliAutolinkingSourcesAsync(
      '/root/apps/demo',
      await normalizeOptionsAsync('/app')
    );
    expect(sources).toContainEqual(
      expect.objectContaining({
        type: 'dir',
        filePath: '../../node_modules/react-native-reanimated',
      })
    );
    expect(sources).toMatchSnapshot();
  });

  it('should not contain absolute paths', async () => {
    const mockSpawnAsync = spawnAsync as jest.MockedFunction<typeof spawnAsync>;
    const fixture = fs.readFileSync(
      path.join(__dirname, 'fixtures', 'RncliAutoLinking.json'),
      'utf8'
    );
    mockSpawnAsync.mockResolvedValue({
      stdout: fixture,
      stderr: '',
      status: 0,
      signal: null,
      output: [fixture, ''],
    });
    const sources = await getRncliAutolinkingSourcesAsync(
      '/root/apps/demo',
      await normalizeOptionsAsync('/app')
    );
    for (const source of sources) {
      if (source.type === 'dir' || source.type === 'file') {
        expect(source.filePath).not.toMatch(/^\/root/);
      } else {
        expect(source.contents).not.toMatch(/"\/root\//);
      }
    }
  });
});
