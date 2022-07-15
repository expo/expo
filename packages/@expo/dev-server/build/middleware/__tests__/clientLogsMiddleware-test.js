"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bunyan_1 = __importDefault(require("@expo/bunyan"));
const body_parser_1 = __importDefault(require("body-parser"));
const connect_1 = __importDefault(require("connect"));
const http_1 = __importDefault(require("http"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const clientLogsMiddleware_1 = __importStar(require("../clientLogsMiddleware"));
const headers = {
    'content-type': 'application/json',
    'device-id': '11111111-CAFE-0000-0000-111111111111',
    'session-id': '22222222-C0DE-0000-0000-222222222222',
    'device-name': 'iPhone',
    'expo-platform': 'ios',
};
describe(clientLogsMiddleware_1.getDevicePlatformFromAppRegistryStartupMessage, () => {
    it(`finds platform`, () => {
        expect((0, clientLogsMiddleware_1.getDevicePlatformFromAppRegistryStartupMessage)([
            'Running "main" with {"initialProps":{"exp":{"shell":false,"manifestString":"{\\"name\\":\\"My App\\",\\"slug\\":\\"my-app\\",\\"version\\":\\"1.0.0\\",\\"orientation\\":\\"portrait\\",\\"icon\\":\\".\\\\/assets\\\\/icon.png\\",\\"splash\\":{\\"image\\":\\".\\\\/assets\\\\/splash.png\\",\\"resizeMode\\":\\"contain\\",\\"backgroundColor\\":\\"#ffffff\\",\\"imageUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/assets\\\\/.\\\\/assets\\\\/splash.png\\"},\\"updates\\":{\\"fallbackToCacheTimeout\\":0},\\"plugins\\":[],\\"assetBundlePatterns\\":[\\"**\\\\/*\\"],\\"ios\\":{\\"supportsTablet\\":true,\\"bundleIdentifier\\":\\"com.bacon.yolo41\\"},\\"android\\":{\\"adaptiveIcon\\":{\\"foregroundImage\\":\\".\\\\/assets\\\\/adaptive-icon.png\\",\\"backgroundColor\\":\\"#FFFFFF\\",\\"foregroundImageUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/assets\\\\/.\\\\/assets\\\\/adaptive-icon.png\\"}},\\"web\\":{\\"favicon\\":\\".\\\\/assets\\\\/favicon.png\\"},\\"_internal\\":{\\"isDebug\\":false,\\"projectRoot\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\",\\"dynamicConfigPath\\":null,\\"staticConfigPath\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\\\/app.json\\",\\"packageJsonPath\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\\\/package.json\\"},\\"sdkVersion\\":\\"42.0.0\\",\\"platforms\\":[\\"ios\\",\\"android\\",\\"web\\"],\\"developer\\":{\\"tool\\":\\"expo-cli\\",\\"projectRoot\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\"},\\"packagerOpts\\":{\\"scheme\\":null,\\"hostType\\":\\"lan\\",\\"lanType\\":\\"ip\\",\\"devClient\\":false,\\"dev\\":true,\\"minify\\":false,\\"urlRandomness\\":null,\\"https\\":false},\\"mainModuleName\\":\\"index\\",\\"__flipperHack\\":\\"React Native packager is running\\",\\"debuggerHost\\":\\"192.168.6.113:19000\\",\\"logUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/logs\\",\\"hostUri\\":\\"192.168.6.113:19000\\",\\"bundleUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/index.bundle?platform=android&dev=true&hot=false&minify=false\\",\\"iconUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/assets\\\\/.\\\\/assets\\\\/icon.png\\",\\"id\\":\\"@bacon\\\\/my-app\\",\\"isVerified\\":true,\\"primaryColor\\":\\"#023C69\\"}"}},"rootTag":601}',
        ])).toBe('android');
    });
    it(`finds platform when platform query param is not first`, () => {
        expect((0, clientLogsMiddleware_1.getDevicePlatformFromAppRegistryStartupMessage)([
            'Running "main" with {"initialProps":{"exp":{"shell":false,"manifestString":"{\\"name\\":\\"My App\\",\\"slug\\":\\"my-app\\",\\"version\\":\\"1.0.0\\",\\"orientation\\":\\"portrait\\",\\"icon\\":\\".\\\\/assets\\\\/icon.png\\",\\"splash\\":{\\"image\\":\\".\\\\/assets\\\\/splash.png\\",\\"resizeMode\\":\\"contain\\",\\"backgroundColor\\":\\"#ffffff\\",\\"imageUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/assets\\\\/.\\\\/assets\\\\/splash.png\\"},\\"updates\\":{\\"fallbackToCacheTimeout\\":0},\\"plugins\\":[],\\"assetBundlePatterns\\":[\\"**\\\\/*\\"],\\"ios\\":{\\"supportsTablet\\":true,\\"bundleIdentifier\\":\\"com.bacon.yolo41\\"},\\"android\\":{\\"adaptiveIcon\\":{\\"foregroundImage\\":\\".\\\\/assets\\\\/adaptive-icon.png\\",\\"backgroundColor\\":\\"#FFFFFF\\",\\"foregroundImageUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/assets\\\\/.\\\\/assets\\\\/adaptive-icon.png\\"}},\\"web\\":{\\"favicon\\":\\".\\\\/assets\\\\/favicon.png\\"},\\"_internal\\":{\\"isDebug\\":false,\\"projectRoot\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\",\\"dynamicConfigPath\\":null,\\"staticConfigPath\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\\\/app.json\\",\\"packageJsonPath\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\\\/package.json\\"},\\"sdkVersion\\":\\"42.0.0\\",\\"platforms\\":[\\"ios\\",\\"android\\",\\"web\\"],\\"developer\\":{\\"tool\\":\\"expo-cli\\",\\"projectRoot\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\"},\\"packagerOpts\\":{\\"scheme\\":null,\\"hostType\\":\\"lan\\",\\"lanType\\":\\"ip\\",\\"devClient\\":false,\\"dev\\":true,\\"minify\\":false,\\"urlRandomness\\":null,\\"https\\":false},\\"mainModuleName\\":\\"index\\",\\"__flipperHack\\":\\"React Native packager is running\\",\\"debuggerHost\\":\\"192.168.6.113:19000\\",\\"logUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/logs\\",\\"hostUri\\":\\"192.168.6.113:19000\\",\\"bundleUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/index.bundle?dev=true&platform=ios&hot=false&minify=false\\",\\"iconUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/assets\\\\/.\\\\/assets\\\\/icon.png\\",\\"id\\":\\"@bacon\\\\/my-app\\",\\"isVerified\\":true,\\"primaryColor\\":\\"#023C69\\"}"}},"rootTag":601}',
        ])).toBe('ios');
    });
    it(`finds platform when platform query param is last`, () => {
        expect((0, clientLogsMiddleware_1.getDevicePlatformFromAppRegistryStartupMessage)([
            'Running "main" with {"initialProps":{"exp":{"shell":false,"manifestString":"{\\"name\\":\\"My App\\",\\"slug\\":\\"my-app\\",\\"version\\":\\"1.0.0\\",\\"orientation\\":\\"portrait\\",\\"icon\\":\\".\\\\/assets\\\\/icon.png\\",\\"splash\\":{\\"image\\":\\".\\\\/assets\\\\/splash.png\\",\\"resizeMode\\":\\"contain\\",\\"backgroundColor\\":\\"#ffffff\\",\\"imageUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/assets\\\\/.\\\\/assets\\\\/splash.png\\"},\\"updates\\":{\\"fallbackToCacheTimeout\\":0},\\"plugins\\":[],\\"assetBundlePatterns\\":[\\"**\\\\/*\\"],\\"ios\\":{\\"supportsTablet\\":true,\\"bundleIdentifier\\":\\"com.bacon.yolo41\\"},\\"android\\":{\\"adaptiveIcon\\":{\\"foregroundImage\\":\\".\\\\/assets\\\\/adaptive-icon.png\\",\\"backgroundColor\\":\\"#FFFFFF\\",\\"foregroundImageUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/assets\\\\/.\\\\/assets\\\\/adaptive-icon.png\\"}},\\"web\\":{\\"favicon\\":\\".\\\\/assets\\\\/favicon.png\\"},\\"_internal\\":{\\"isDebug\\":false,\\"projectRoot\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\",\\"dynamicConfigPath\\":null,\\"staticConfigPath\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\\\/app.json\\",\\"packageJsonPath\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\\\/package.json\\"},\\"sdkVersion\\":\\"42.0.0\\",\\"platforms\\":[\\"ios\\",\\"android\\",\\"web\\"],\\"developer\\":{\\"tool\\":\\"expo-cli\\",\\"projectRoot\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\"},\\"packagerOpts\\":{\\"scheme\\":null,\\"hostType\\":\\"lan\\",\\"lanType\\":\\"ip\\",\\"devClient\\":false,\\"dev\\":true,\\"minify\\":false,\\"urlRandomness\\":null,\\"https\\":false},\\"mainModuleName\\":\\"index\\",\\"__flipperHack\\":\\"React Native packager is running\\",\\"debuggerHost\\":\\"192.168.6.113:19000\\",\\"logUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/logs\\",\\"hostUri\\":\\"192.168.6.113:19000\\",\\"bundleUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/index.bundle?dev=true&hot=false&minify=false&platform=web\\",\\"iconUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/assets\\\\/.\\\\/assets\\\\/icon.png\\",\\"id\\":\\"@bacon\\\\/my-app\\",\\"isVerified\\":true,\\"primaryColor\\":\\"#023C69\\"}"}},"rootTag":601}',
        ])).toBe('web');
    });
    it(`finds unknown platform`, () => {
        expect((0, clientLogsMiddleware_1.getDevicePlatformFromAppRegistryStartupMessage)([
            'Running "main" with {"initialProps":{"exp":{"shell":false,"manifestString":"{\\"name\\":\\"My App\\",\\"slug\\":\\"my-app\\",\\"version\\":\\"1.0.0\\",\\"orientation\\":\\"portrait\\",\\"icon\\":\\".\\\\/assets\\\\/icon.png\\",\\"splash\\":{\\"image\\":\\".\\\\/assets\\\\/splash.png\\",\\"resizeMode\\":\\"contain\\",\\"backgroundColor\\":\\"#ffffff\\",\\"imageUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/assets\\\\/.\\\\/assets\\\\/splash.png\\"},\\"updates\\":{\\"fallbackToCacheTimeout\\":0},\\"plugins\\":[],\\"assetBundlePatterns\\":[\\"**\\\\/*\\"],\\"ios\\":{\\"supportsTablet\\":true,\\"bundleIdentifier\\":\\"com.bacon.yolo41\\"},\\"android\\":{\\"adaptiveIcon\\":{\\"foregroundImage\\":\\".\\\\/assets\\\\/adaptive-icon.png\\",\\"backgroundColor\\":\\"#FFFFFF\\",\\"foregroundImageUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/assets\\\\/.\\\\/assets\\\\/adaptive-icon.png\\"}},\\"web\\":{\\"favicon\\":\\".\\\\/assets\\\\/favicon.png\\"},\\"_internal\\":{\\"isDebug\\":false,\\"projectRoot\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\",\\"dynamicConfigPath\\":null,\\"staticConfigPath\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\\\/app.json\\",\\"packageJsonPath\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\\\/package.json\\"},\\"sdkVersion\\":\\"42.0.0\\",\\"platforms\\":[\\"ios\\",\\"android\\",\\"web\\"],\\"developer\\":{\\"tool\\":\\"expo-cli\\",\\"projectRoot\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\"},\\"packagerOpts\\":{\\"scheme\\":null,\\"hostType\\":\\"lan\\",\\"lanType\\":\\"ip\\",\\"devClient\\":false,\\"dev\\":true,\\"minify\\":false,\\"urlRandomness\\":null,\\"https\\":false},\\"mainModuleName\\":\\"index\\",\\"__flipperHack\\":\\"React Native packager is running\\",\\"debuggerHost\\":\\"192.168.6.113:19000\\",\\"logUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/logs\\",\\"hostUri\\":\\"192.168.6.113:19000\\",\\"bundleUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/index.bundle?dev=true&platform=bacon&hot=false&minify=false\\",\\"iconUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/assets\\\\/.\\\\/assets\\\\/icon.png\\",\\"id\\":\\"@bacon\\\\/my-app\\",\\"isVerified\\":true,\\"primaryColor\\":\\"#023C69\\"}"}},"rootTag":601}',
        ])).toBe('bacon');
    });
    it(`returns null when platform cannot be found`, () => {
        expect((0, clientLogsMiddleware_1.getDevicePlatformFromAppRegistryStartupMessage)([
            'Running "main" with {"initialProps":{"exp":{"shell":false,"manifestString":"{\\"name\\":\\"My App\\",\\"slug\\":\\"my-app\\",\\"version\\":\\"1.0.0\\",\\"orientation\\":\\"portrait\\",\\"icon\\":\\".\\\\/assets\\\\/icon.png\\",\\"splash\\":{\\"image\\":\\".\\\\/assets\\\\/splash.png\\",\\"resizeMode\\":\\"contain\\",\\"backgroundColor\\":\\"#ffffff\\",\\"imageUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/assets\\\\/.\\\\/assets\\\\/splash.png\\"},\\"updates\\":{\\"fallbackToCacheTimeout\\":0},\\"plugins\\":[],\\"assetBundlePatterns\\":[\\"**\\\\/*\\"],\\"ios\\":{\\"supportsTablet\\":true,\\"bundleIdentifier\\":\\"com.bacon.yolo41\\"},\\"android\\":{\\"adaptiveIcon\\":{\\"foregroundImage\\":\\".\\\\/assets\\\\/adaptive-icon.png\\",\\"backgroundColor\\":\\"#FFFFFF\\",\\"foregroundImageUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/assets\\\\/.\\\\/assets\\\\/adaptive-icon.png\\"}},\\"web\\":{\\"favicon\\":\\".\\\\/assets\\\\/favicon.png\\"},\\"_internal\\":{\\"isDebug\\":false,\\"projectRoot\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\",\\"dynamicConfigPath\\":null,\\"staticConfigPath\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\\\/app.json\\",\\"packageJsonPath\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\\\/package.json\\"},\\"sdkVersion\\":\\"42.0.0\\",\\"platforms\\":[\\"ios\\",\\"android\\",\\"web\\"],\\"developer\\":{\\"tool\\":\\"expo-cli\\",\\"projectRoot\\":\\"\\\\/Users\\\\/evanbacon\\\\/Documents\\\\/GitHub\\\\/lab\\\\/yolo41\\"},\\"packagerOpts\\":{\\"scheme\\":null,\\"hostType\\":\\"lan\\",\\"lanType\\":\\"ip\\",\\"devClient\\":false,\\"dev\\":true,\\"minify\\":false,\\"urlRandomness\\":null,\\"https\\":false},\\"mainModuleName\\":\\"index\\",\\"__flipperHack\\":\\"React Native packager is running\\",\\"debuggerHost\\":\\"192.168.6.113:19000\\",\\"logUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/logs\\",\\"hostUri\\":\\"192.168.6.113:19000\\",\\"bundleUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/index.bundle?dev=true&hot=false&minify=false\\",\\"iconUrl\\":\\"http:\\\\/\\\\/192.168.6.113:19000\\\\/assets\\\\/.\\\\/assets\\\\/icon.png\\",\\"id\\":\\"@bacon\\\\/my-app\\",\\"isVerified\\":true,\\"primaryColor\\":\\"#023C69\\"}"}},"rootTag":601}',
        ])).toBe(null);
    });
});
it('logs messages from the device', async () => {
    const { server, url, logStream } = await createServerAsync();
    try {
        const response = await (0, node_fetch_1.default)(`${url}/logs`, {
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
    }
    finally {
        server.close();
    }
});
class TestLogStream {
    constructor() {
        this.output = [];
    }
    write(record) {
        var _a;
        const message = record.includesStack ? JSON.parse(record.msg).message : record.msg;
        const deviceName = (_a = record.deviceName) !== null && _a !== void 0 ? _a : '';
        if (record.level < bunyan_1.default.INFO) {
            this.output.push(`${deviceName}: [debug] ${message}`);
        }
        else if (record.level < bunyan_1.default.WARN) {
            this.output.push(`${deviceName}: [info] ${message}`);
        }
        else if (record.level < bunyan_1.default.ERROR) {
            this.output.push(`${deviceName}: [warn] ${message}`);
        }
        else {
            this.output.push(`${deviceName}: [error] ${message}`);
        }
    }
}
async function createServerAsync() {
    const logStream = new TestLogStream();
    const logger = bunyan_1.default.createLogger({
        name: 'expo-test',
        streams: [
            {
                type: 'raw',
                stream: logStream,
                level: 'info',
            },
        ],
    });
    const app = (0, connect_1.default)().use(body_parser_1.default.json()).use((0, clientLogsMiddleware_1.default)(logger));
    const server = http_1.default.createServer(app);
    await new Promise((resolve, reject) => server.listen((error) => {
        if (error)
            reject(error);
        else
            resolve();
    }));
    const address = server.address();
    if (!address || typeof address === 'string')
        throw new Error('server has no port');
    return {
        server,
        url: `http://localhost:${address.port}`,
        logStream,
    };
}
//# sourceMappingURL=clientLogsMiddleware-test.js.map