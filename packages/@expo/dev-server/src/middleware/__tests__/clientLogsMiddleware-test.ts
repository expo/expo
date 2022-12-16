import bunyan from '@expo/bunyan';
import bodyParser from 'body-parser';
import connect from 'connect';
import http from 'http';
import fetch from 'node-fetch';

import clientLogsMiddleware, {
  getDevicePlatformFromAppRegistryStartupMessage,
} from '../clientLogsMiddleware';

const headers = {
  'content-type': 'application/json',
  'device-id': '11111111-CAFE-0000-0000-111111111111',
  'session-id': '22222222-C0DE-0000-0000-222222222222',
  'device-name': 'iPhone',
  'expo-platform': 'ios',
};

describe(getDevicePlatformFromAppRegistryStartupMessage, () => {
  it(`finds platform`, () => {
    expect(
      getDevicePlatformFromAppRegistryStartupMessage([
        'Running "main" with {"initialProps":{"exp":{"shell":false,"manifestString":"{\\"name\\":\\"My App\\",\\"slug\\":\\"my-app\\",\\"version\\":\\"1.0.0\\",\\"orientation\\":\\"portrait\\",\\"icon\\":\\".\\\\/assets\\\\/icon.png\\",\\"splash\\":{\\"image\\":\\".\\\\/assets\\\\/splash.png\\",\\"resizeMode\\":\\"contain\\",\\"backgroundColor\\":\\"#ffffff\\",\\"imageUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/assets\\\\/.\\\\/assets\\\\/splash.png\\"},\\"updates\\":{\\"fallbackToCacheTimeout\\":0},\\"plugins\\":[],\\"assetBundlePatterns\\":[\\"**\\\\/*\\"],\\"ios\\":{\\"supportsTablet\\":true,\\"bundleIdentifier\\":\\"com.bacon.yolo41\\"},\\"android\\":{\\"adaptiveIcon\\":{\\"foregroundImage\\":\\".\\\\/assets\\\\/adaptive-icon.png\\",\\"backgroundColor\\":\\"#FFFFFF\\",\\"foregroundImageUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/assets\\\\/.\\\\/assets\\\\/adaptive-icon.png\\"}},\\"web\\":{\\"favicon\\":\\".\\\\/assets\\\\/favicon.png\\"},\\"_internal\\":{\\"isDebug\\":false,\\"projectRoot\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\",\\"dynamicConfigPath\\":null,\\"staticConfigPath\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\\\/app.json\\",\\"packageJsonPath\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\\\/package.json\\"},\\"sdkVersion\\":\\"42.0.0\\",\\"platforms\\":[\\"ios\\",\\"android\\",\\"web\\"],\\"developer\\":{\\"tool\\":\\"expo-cli\\",\\"projectRoot\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\"},\\"packagerOpts\\":{\\"scheme\\":null,\\"hostType\\":\\"lan\\",\\"lanType\\":\\"ip\\",\\"devClient\\":false,\\"dev\\":true,\\"minify\\":false,\\"urlRandomness\\":null,\\"https\\":false},\\"mainModuleName\\":\\"index\\",\\"__flipperHack\\":\\"React Native packager is running\\",\\"debuggerHost\\":\\"192.168.6.113:19000\\",\\"logUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/logs\\",\\"hostUri\\":\\"192.168.6.113:19000\\",\\"bundleUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/index.bundle?platform=android&dev=true&hot=false&minify=false\\",\\"iconUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/assets\\\\/.\\\\/assets\\\\/icon.png\\",\\"id\\":\\"@bacon\\\\/my-app\\",\\"isVerified\\":true,\\"primaryColor\\":\\"#023C69\\"}"}},"rootTag":601}',
      ])
    ).toBe('android');
  });
  it(`finds platform when platform query param is not first`, () => {
    expect(
      getDevicePlatformFromAppRegistryStartupMessage([
        'Running "main" with {"initialProps":{"exp":{"shell":false,"manifestString":"{\\"name\\":\\"My App\\",\\"slug\\":\\"my-app\\",\\"version\\":\\"1.0.0\\",\\"orientation\\":\\"portrait\\",\\"icon\\":\\".\\\\/assets\\\\/icon.png\\",\\"splash\\":{\\"image\\":\\".\\\\/assets\\\\/splash.png\\",\\"resizeMode\\":\\"contain\\",\\"backgroundColor\\":\\"#ffffff\\",\\"imageUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/assets\\\\/.\\\\/assets\\\\/splash.png\\"},\\"updates\\":{\\"fallbackToCacheTimeout\\":0},\\"plugins\\":[],\\"assetBundlePatterns\\":[\\"**\\\\/*\\"],\\"ios\\":{\\"supportsTablet\\":true,\\"bundleIdentifier\\":\\"com.bacon.yolo41\\"},\\"android\\":{\\"adaptiveIcon\\":{\\"foregroundImage\\":\\".\\\\/assets\\\\/adaptive-icon.png\\",\\"backgroundColor\\":\\"#FFFFFF\\",\\"foregroundImageUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/assets\\\\/.\\\\/assets\\\\/adaptive-icon.png\\"}},\\"web\\":{\\"favicon\\":\\".\\\\/assets\\\\/favicon.png\\"},\\"_internal\\":{\\"isDebug\\":false,\\"projectRoot\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\",\\"dynamicConfigPath\\":null,\\"staticConfigPath\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\\\/app.json\\",\\"packageJsonPath\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\\\/package.json\\"},\\"sdkVersion\\":\\"42.0.0\\",\\"platforms\\":[\\"ios\\",\\"android\\",\\"web\\"],\\"developer\\":{\\"tool\\":\\"expo-cli\\",\\"projectRoot\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\"},\\"packagerOpts\\":{\\"scheme\\":null,\\"hostType\\":\\"lan\\",\\"lanType\\":\\"ip\\",\\"devClient\\":false,\\"dev\\":true,\\"minify\\":false,\\"urlRandomness\\":null,\\"https\\":false},\\"mainModuleName\\":\\"index\\",\\"__flipperHack\\":\\"React Native packager is running\\",\\"debuggerHost\\":\\"192.168.6.113:19000\\",\\"logUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/logs\\",\\"hostUri\\":\\"192.168.6.113:19000\\",\\"bundleUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/index.bundle?dev=true&platform=ios&hot=false&minify=false\\",\\"iconUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/assets\\\\/.\\\\/assets\\\\/icon.png\\",\\"id\\":\\"@bacon\\\\/my-app\\",\\"isVerified\\":true,\\"primaryColor\\":\\"#023C69\\"}"}},"rootTag":601}',
      ])
    ).toBe('ios');
  });
  it(`finds platform when platform query param is last`, () => {
    expect(
      getDevicePlatformFromAppRegistryStartupMessage([
        'Running "main" with {"initialProps":{"exp":{"shell":false,"manifestString":"{\\"name\\":\\"My App\\",\\"slug\\":\\"my-app\\",\\"version\\":\\"1.0.0\\",\\"orientation\\":\\"portrait\\",\\"icon\\":\\".\\\\/assets\\\\/icon.png\\",\\"splash\\":{\\"image\\":\\".\\\\/assets\\\\/splash.png\\",\\"resizeMode\\":\\"contain\\",\\"backgroundColor\\":\\"#ffffff\\",\\"imageUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/assets\\\\/.\\\\/assets\\\\/splash.png\\"},\\"updates\\":{\\"fallbackToCacheTimeout\\":0},\\"plugins\\":[],\\"assetBundlePatterns\\":[\\"**\\\\/*\\"],\\"ios\\":{\\"supportsTablet\\":true,\\"bundleIdentifier\\":\\"com.bacon.yolo41\\"},\\"android\\":{\\"adaptiveIcon\\":{\\"foregroundImage\\":\\".\\\\/assets\\\\/adaptive-icon.png\\",\\"backgroundColor\\":\\"#FFFFFF\\",\\"foregroundImageUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/assets\\\\/.\\\\/assets\\\\/adaptive-icon.png\\"}},\\"web\\":{\\"favicon\\":\\".\\\\/assets\\\\/favicon.png\\"},\\"_internal\\":{\\"isDebug\\":false,\\"projectRoot\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\",\\"dynamicConfigPath\\":null,\\"staticConfigPath\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\\\/app.json\\",\\"packageJsonPath\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\\\/package.json\\"},\\"sdkVersion\\":\\"42.0.0\\",\\"platforms\\":[\\"ios\\",\\"android\\",\\"web\\"],\\"developer\\":{\\"tool\\":\\"expo-cli\\",\\"projectRoot\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\"},\\"packagerOpts\\":{\\"scheme\\":null,\\"hostType\\":\\"lan\\",\\"lanType\\":\\"ip\\",\\"devClient\\":false,\\"dev\\":true,\\"minify\\":false,\\"urlRandomness\\":null,\\"https\\":false},\\"mainModuleName\\":\\"index\\",\\"__flipperHack\\":\\"React Native packager is running\\",\\"debuggerHost\\":\\"192.168.6.113:19000\\",\\"logUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/logs\\",\\"hostUri\\":\\"192.168.6.113:19000\\",\\"bundleUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/index.bundle?dev=true&hot=false&minify=false&platform=web\\",\\"iconUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/assets\\\\/.\\\\/assets\\\\/icon.png\\",\\"id\\":\\"@bacon\\\\/my-app\\",\\"isVerified\\":true,\\"primaryColor\\":\\"#023C69\\"}"}},"rootTag":601}',
      ])
    ).toBe('web');
  });
  it(`finds unknown platform`, () => {
    expect(
      getDevicePlatformFromAppRegistryStartupMessage([
        'Running "main" with {"initialProps":{"exp":{"shell":false,"manifestString":"{\\"name\\":\\"My App\\",\\"slug\\":\\"my-app\\",\\"version\\":\\"1.0.0\\",\\"orientation\\":\\"portrait\\",\\"icon\\":\\".\\\\/assets\\\\/icon.png\\",\\"splash\\":{\\"image\\":\\".\\\\/assets\\\\/splash.png\\",\\"resizeMode\\":\\"contain\\",\\"backgroundColor\\":\\"#ffffff\\",\\"imageUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/assets\\\\/.\\\\/assets\\\\/splash.png\\"},\\"updates\\":{\\"fallbackToCacheTimeout\\":0},\\"plugins\\":[],\\"assetBundlePatterns\\":[\\"**\\\\/*\\"],\\"ios\\":{\\"supportsTablet\\":true,\\"bundleIdentifier\\":\\"com.bacon.yolo41\\"},\\"android\\":{\\"adaptiveIcon\\":{\\"foregroundImage\\":\\".\\\\/assets\\\\/adaptive-icon.png\\",\\"backgroundColor\\":\\"#FFFFFF\\",\\"foregroundImageUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/assets\\\\/.\\\\/assets\\\\/adaptive-icon.png\\"}},\\"web\\":{\\"favicon\\":\\".\\\\/assets\\\\/favicon.png\\"},\\"_internal\\":{\\"isDebug\\":false,\\"projectRoot\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\",\\"dynamicConfigPath\\":null,\\"staticConfigPath\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\\\/app.json\\",\\"packageJsonPath\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\\\/package.json\\"},\\"sdkVersion\\":\\"42.0.0\\",\\"platforms\\":[\\"ios\\",\\"android\\",\\"web\\"],\\"developer\\":{\\"tool\\":\\"expo-cli\\",\\"projectRoot\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\"},\\"packagerOpts\\":{\\"scheme\\":null,\\"hostType\\":\\"lan\\",\\"lanType\\":\\"ip\\",\\"devClient\\":false,\\"dev\\":true,\\"minify\\":false,\\"urlRandomness\\":null,\\"https\\":false},\\"mainModuleName\\":\\"index\\",\\"__flipperHack\\":\\"React Native packager is running\\",\\"debuggerHost\\":\\"192.168.6.113:19000\\",\\"logUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/logs\\",\\"hostUri\\":\\"192.168.6.113:19000\\",\\"bundleUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/index.bundle?dev=true&platform=bacon&hot=false&minify=false\\",\\"iconUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/assets\\\\/.\\\\/assets\\\\/icon.png\\",\\"id\\":\\"@bacon\\\\/my-app\\",\\"isVerified\\":true,\\"primaryColor\\":\\"#023C69\\"}"}},"rootTag":601}',
      ])
    ).toBe('bacon');
  });
  it(`returns null when platform cannot be found`, () => {
    expect(
      getDevicePlatformFromAppRegistryStartupMessage([
        'Running "main" with {"initialProps":{"exp":{"shell":false,"manifestString":"{\\"name\\":\\"My App\\",\\"slug\\":\\"my-app\\",\\"version\\":\\"1.0.0\\",\\"orientation\\":\\"portrait\\",\\"icon\\":\\".\\\\/assets\\\\/icon.png\\",\\"splash\\":{\\"image\\":\\".\\\\/assets\\\\/splash.png\\",\\"resizeMode\\":\\"contain\\",\\"backgroundColor\\":\\"#ffffff\\",\\"imageUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/assets\\\\/.\\\\/assets\\\\/splash.png\\"},\\"updates\\":{\\"fallbackToCacheTimeout\\":0},\\"plugins\\":[],\\"assetBundlePatterns\\":[\\"**\\\\/*\\"],\\"ios\\":{\\"supportsTablet\\":true,\\"bundleIdentifier\\":\\"com.bacon.yolo41\\"},\\"android\\":{\\"adaptiveIcon\\":{\\"foregroundImage\\":\\".\\\\/assets\\\\/adaptive-icon.png\\",\\"backgroundColor\\":\\"#FFFFFF\\",\\"foregroundImageUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/assets\\\\/.\\\\/assets\\\\/adaptive-icon.png\\"}},\\"web\\":{\\"favicon\\":\\".\\\\/assets\\\\/favicon.png\\"},\\"_internal\\":{\\"isDebug\\":false,\\"projectRoot\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\",\\"dynamicConfigPath\\":null,\\"staticConfigPath\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\\\/app.json\\",\\"packageJsonPath\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\\\/package.json\\"},\\"sdkVersion\\":\\"42.0.0\\",\\"platforms\\":[\\"ios\\",\\"android\\",\\"web\\"],\\"developer\\":{\\"tool\\":\\"expo-cli\\",\\"projectRoot\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\"},\\"packagerOpts\\":{\\"scheme\\":null,\\"hostType\\":\\"lan\\",\\"lanType\\":\\"ip\\",\\"devClient\\":false,\\"dev\\":true,\\"minify\\":false,\\"urlRandomness\\":null,\\"https\\":false},\\"mainModuleName\\":\\"index\\",\\"__flipperHack\\":\\"React Native packager is running\\",\\"debuggerHost\\":\\"192.168.6.113:19000\\",\\"logUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/logs\\",\\"hostUri\\":\\"192.168.6.113:19000\\",\\"bundleUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/index.bundle?dev=true&hot=false&minify=false\\",\\"iconUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/assets\\\\/.\\\\/assets\\\\/icon.png\\",\\"id\\":\\"@bacon\\\\/my-app\\",\\"isVerified\\":true,\\"primaryColor\\":\\"#023C69\\"}"}},"rootTag":601}',
      ])
    ).toBe(null);
  });
});

it('logs messages from the device', async () => {
  const { server, url, logStream } = await createServerAsync();
  try {
    const response = await fetch(`${url}/logs`, {
      method: 'POST',
      headers,
      body: JSON.stringify([
        {
          count: 1,
          level: 'info',
          body: ['Hello world!'],
          includesStack: false,
          groupDepth: 0,
        },
        {
          count: 2,
          level: 'error',
          body: [
            {
              message: 'Something went wrong...',
              stack: 'App.js:3:12 in <global>',
            },
          ],
          includesStack: true,
          groupDepth: 0,
        },
        {
          // We want this to be filtered out.
          count: 3,
          level: 'info',
          body: [
            'BugReporting extraData:',
            'Object {\n' +
              '  "AppRegistry.runApplication1": "Running \\"main\\" with yada yada yada",\n' +
              '}',
          ],
          includesStack: false,
          groupDepth: 0,
        },
      ]),
    });
    expect(response.ok).toBe(true);
    expect(logStream.output).toMatchSnapshot();
  } finally {
    server.close();
  }
});

class TestLogStream {
  output: string[] = [];

  write(record: any) {
    const message = record.includesStack ? JSON.parse(record.msg).message : record.msg;
    const deviceName = record.deviceName ?? '';
    if (record.level < bunyan.INFO) {
      this.output.push(`${deviceName}: [debug] ${message}`);
    } else if (record.level < bunyan.WARN) {
      this.output.push(`${deviceName}: [info] ${message}`);
    } else if (record.level < bunyan.ERROR) {
      this.output.push(`${deviceName}: [warn] ${message}`);
    } else {
      this.output.push(`${deviceName}: [error] ${message}`);
    }
  }
}

async function createServerAsync() {
  const logStream = new TestLogStream();
  const logger = bunyan.createLogger({
    name: 'expo-test',
    streams: [
      {
        type: 'raw',
        stream: logStream,
        level: 'info',
      },
    ],
  });
  const app = connect().use(bodyParser.json()).use(clientLogsMiddleware(logger));

  const server = http.createServer(app);
  await new Promise<void>((resolve, reject) =>
    server.listen((error: any) => {
      if (error) reject(error);
      else resolve();
    })
  );

  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('server has no port');

  return {
    server,
    url: `http://localhost:${address.port}`,
    logStream,
  };
}
