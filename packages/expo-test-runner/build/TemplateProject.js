"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const BundlerController_1 = __importDefault(require("./BundlerController"));
const Platform_1 = require("./Platform");
const TemplateEvaluator_1 = __importDefault(require("./TemplateEvaluator"));
const TemplateFile_1 = require("./TemplateFile");
const Utils_1 = require("./Utils");
class TemplateProject {
    constructor(config, name, platform, configFilePath) {
        this.config = config;
        this.name = name;
        this.platform = platform;
        this.configFilePath = configFilePath;
    }
    getDefinitions() {
        return {
            name: 'devcliente2e',
            appEntryPoint: 'e2e/app/App',
        };
    }
    async createApplicationAsync(projectPath) {
        // TODO: this assumes there is a parent folder
        const parentFolder = path_1.default.resolve(projectPath, '..');
        if (!fs_1.default.existsSync(parentFolder)) {
            fs_1.default.mkdirSync(parentFolder, { recursive: true });
        }
        const appName = 'dev-client-e2e';
        await (0, spawn_async_1.default)('yarn', ['create', 'expo-app', appName], {
            stdio: 'inherit',
            cwd: parentFolder,
        });
        fs_1.default.renameSync(path_1.default.join(parentFolder, appName), projectPath);
        const repoRoot = path_1.default.resolve(this.configFilePath, '..', '..', '..');
        const localCliBin = path_1.default.join(repoRoot, 'packages/@expo/cli/build/bin/cli');
        await (0, spawn_async_1.default)(localCliBin, ['install', 'detox', 'jest'], {
            stdio: 'inherit',
            cwd: projectPath,
        });
        // add local dependencies
        let packageJson = JSON.parse(fs_1.default.readFileSync(path_1.default.join(projectPath, 'package.json'), 'utf-8'));
        packageJson = {
            ...packageJson,
            dependencies: {
                ...packageJson.dependencies,
                'expo-dev-client': `file:${repoRoot}/packages/expo-dev-client`,
                'expo-dev-menu-interface': `file:${repoRoot}/packages/expo-dev-menu-interface`,
                'expo-status-bar': `file:${repoRoot}/packages/expo-status-bar`,
                expo: `file:${repoRoot}/packages/expo`,
                'jest-circus': packageJson.dependencies.jest,
            },
            resolutions: {
                ...packageJson.resolutions,
                'expo-application': `file:${repoRoot}/packages/expo-application`,
                'expo-asset': `file:${repoRoot}/packages/expo-asset`,
                'expo-constants': `file:${repoRoot}/packages/expo-constants`,
                'expo-dev-launcher': `file:${repoRoot}/packages/expo-dev-launcher`,
                'expo-dev-menu': `file:${repoRoot}/packages/expo-dev-menu`,
                'expo-error-recovery': `file:${repoRoot}/packages/expo-error-recovery`,
                'expo-file-system': `file:${repoRoot}/packages/expo-file-system`,
                'expo-font': `file:${repoRoot}/packages/expo-font`,
                'expo-keep-awake': `file:${repoRoot}/packages/expo-keep-awake`,
                'expo-manifests': `file:${repoRoot}/packages/expo-manifests`,
                'expo-modules-autolinking': `file:${repoRoot}/packages/expo-modules-autolinking`,
                'expo-modules-core': `file:${repoRoot}/packages/expo-modules-core`,
                'expo-updates-interface': `file:${repoRoot}/packages/expo-updates-interface`,
            },
        };
        fs_1.default.writeFileSync(path_1.default.join(projectPath, 'package.json'), JSON.stringify(packageJson, null, 2), 'utf-8');
        // configure app.json
        let appJson = JSON.parse(fs_1.default.readFileSync(path_1.default.join(projectPath, 'app.json'), 'utf-8'));
        appJson = {
            ...appJson,
            expo: {
                ...appJson.expo,
                android: { ...appJson.android, package: 'com.testrunner' },
                ios: { ...appJson.ios, bundleIdentifier: 'com.testrunner' },
            },
        };
        fs_1.default.writeFileSync(path_1.default.join(projectPath, 'app.json'), JSON.stringify(appJson, null, 2), 'utf-8');
        // pack local template and prebuild
        const localTemplatePath = path_1.default.join(repoRoot, 'templates', 'expo-template-bare-minimum');
        await (0, spawn_async_1.default)('npm', ['pack', '--pack-destination', projectPath], {
            cwd: localTemplatePath,
            stdio: 'inherit',
        });
        const templateVersion = require(path_1.default.join(localTemplatePath, 'package.json')).version;
        await (0, spawn_async_1.default)(localCliBin, ['prebuild', '--template', `expo-template-bare-minimum-${templateVersion}.tgz`], {
            stdio: 'inherit',
            cwd: projectPath,
        });
        const templateFiles = this.getTemplateFiles();
        await this.copyFilesAsync(projectPath, templateFiles);
        await this.evaluateFiles(projectPath, templateFiles);
        // workaround for instrumented unit test files not compiling in this
        // configuration (ignored in .npmignore)
        await (0, spawn_async_1.default)('rm', ['-rf', 'node_modules/expo-dev-client/android/src/androidTest'], {
            stdio: 'inherit',
            cwd: projectPath,
        });
    }
    getTemplateFiles() {
        var _a, _b;
        const tff = new TemplateFile_1.TemplateFilesFactory('detox');
        const additionalFiles = (_a = this.config.additionalFiles) === null || _a === void 0 ? void 0 : _a.reduce((reducer, file) => ({
            ...reducer,
            [file]: new TemplateFile_1.UserFile(this.userFilePath(file)),
        }), {});
        if ((_b = this.config.android) === null || _b === void 0 ? void 0 : _b.detoxTestFile) {
            additionalFiles['android/app/src/androidTest/java/com/testrunner/DetoxTest.java'] =
                new TemplateFile_1.UserFile(this.userFilePath(this.config.android.detoxTestFile), Platform_1.Platform.Android);
        }
        return {
            'android/build.gradle': tff.androidFile(),
            'android/app/build.gradle': tff.androidFile(),
            'android/app/src/androidTest/java/com/testrunner/DetoxTest.java': tff.androidFile(),
            'android/app/src/main/java/com/testrunner/MainApplication.java': tff.androidFile(),
            'index.js': tff.file(true),
            'ios/devcliente2e/main.m': tff.iosFile(),
            [this.config.detoxConfigFile]: new TemplateFile_1.UserFile(this.userFilePath(this.config.detoxConfigFile), Platform_1.Platform.Both, true),
            ...additionalFiles,
        };
    }
    userFilePath(relativePath) {
        return path_1.default.join(this.configFilePath, '..', relativePath);
    }
    async copyFilesAsync(projectPath, files) {
        await Promise.all(Object.entries(files).map(([path, file]) => file.copy(projectPath, path)));
    }
    async evaluateFiles(projectPath, files) {
        const templateEvaluator = new TemplateEvaluator_1.default(this.getDefinitions());
        await Promise.all(Object.entries(files).map(([path, file]) => file.evaluate(projectPath, path, templateEvaluator)));
    }
    async build(projectPath, test) {
        for (const conf of test.configurations) {
            await (0, spawn_async_1.default)('yarn', ['detox', 'build', '-c', conf], {
                cwd: projectPath,
                stdio: 'inherit',
            });
        }
    }
    async run(projectPath, test) {
        let bundler;
        try {
            bundler = new BundlerController_1.default(projectPath);
            if (test.shouldRunBundler) {
                await bundler.start();
            }
            for (const conf of test.configurations) {
                await (0, spawn_async_1.default)('yarn', ['detox', 'test', '-c', conf, '--ci', '--headless', '--gpu', 'swiftshader_indirect'], {
                    cwd: projectPath,
                    stdio: 'inherit',
                });
                await (0, Utils_1.killVirtualDevicesAsync)(this.platform);
            }
        }
        finally {
            // If bundler wasn't started is noop.
            await (bundler === null || bundler === void 0 ? void 0 : bundler.stop());
        }
    }
}
exports.default = TemplateProject;
//# sourceMappingURL=TemplateProject.js.map