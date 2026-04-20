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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.withIosFmtConsteval = exports.withIosInfoPlist = exports.withIosDeploymentTarget = exports.withIosBuildProperties = void 0;
exports.addFmtConstevalFix = addFmtConstevalFix;
const config_plugins_1 = require("expo/config-plugins");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const pluginConfig_1 = require("./pluginConfig");
const { createBuildPodfilePropsConfigPlugin } = config_plugins_1.IOSConfig.BuildProperties;
exports.withIosBuildProperties = createBuildPodfilePropsConfigPlugin([
    {
        propName: 'ios.useFrameworks',
        propValueGetter: (config) => config.ios?.useFrameworks,
    },
    {
        propName: 'ios.forceStaticLinking',
        propValueGetter: (config) => JSON.stringify(config.ios?.forceStaticLinking ?? []),
    },
    {
        propName: 'EX_DEV_CLIENT_NETWORK_INSPECTOR',
        propValueGetter: (config) => (config.ios?.networkInspector ?? true).toString(),
    },
    {
        propName: 'apple.extraPods',
        propValueGetter: (config) => {
            const extraPods = config.ios?.extraPods ?? [];
            return extraPods.length > 0 ? JSON.stringify(extraPods) : undefined;
        },
    },
    {
        propName: 'apple.ccacheEnabled',
        propValueGetter: (config) => config.ios?.ccacheEnabled?.toString(),
    },
    {
        propName: 'apple.privacyManifestAggregationEnabled',
        propValueGetter: (config) => (config.ios?.privacyManifestAggregationEnabled ?? true).toString(),
    },
    {
        propName: 'ios.buildReactNativeFromSource',
        propValueGetter: (config) => (0, pluginConfig_1.resolveConfigValue)(config, 'ios', 'buildReactNativeFromSource')?.toString(),
    },
    {
        propName: 'expo.useHermesV1',
        propValueGetter: (config) => (0, pluginConfig_1.resolveConfigValue)(config, 'ios', 'useHermesV1')?.toString(),
    },
    {
        propName: 'EXPO_USE_PRECOMPILED_MODULES',
        propValueGetter: (config) => (config.ios?.usePrecompiledModules ?? false).toString(),
    },
], 'withIosBuildProperties');
/** @deprecated use built-in `ios.deploymentTarget` property instead. */
const withIosDeploymentTarget = (config, props) => {
    const deploymentTarget = props.ios?.deploymentTarget;
    if (!deploymentTarget) {
        return config;
    }
    // Updates deployment target in app xcodeproj
    config = withIosDeploymentTargetXcodeProject(config, { deploymentTarget });
    // Updates deployement target in Podfile (Pods project)
    config = withIosDeploymentTargetPodfile(config, props);
    return config;
};
exports.withIosDeploymentTarget = withIosDeploymentTarget;
const withIosInfoPlist = (config, props) => {
    const reactNativeReleaseLevel = (0, pluginConfig_1.resolveConfigValue)(props, 'ios', 'reactNativeReleaseLevel');
    if (reactNativeReleaseLevel) {
        config = withIosReactNativeReleaseLevel(config, { reactNativeReleaseLevel });
    }
    return config;
};
exports.withIosInfoPlist = withIosInfoPlist;
const FMT_CONSTEVAL_FIX_MARKER = 'FMT_USE_CONSTEVAL=0';
const FMT_CONSTEVAL_FIX_SNIPPET = `
    # Fix fmt consteval compilation errors with Apple Clang in Xcode 26+
    installer.pods_project.targets.select { |t| t.name == 'fmt' }.each do |t|
      t.build_configurations.each do |c|
        flags = c.build_settings['OTHER_CPLUSPLUSFLAGS'] || '$(inherited)'
        unless flags.include?('FMT_USE_CONSTEVAL')
          c.build_settings['OTHER_CPLUSPLUSFLAGS'] = "\#{flags} -DFMT_USE_CONSTEVAL=0"
        end
      end
    end`;
function addFmtConstevalFix(podfile) {
    if (podfile.includes(FMT_CONSTEVAL_FIX_MARKER)) {
        return podfile;
    }
    const lines = podfile.split('\n');
    const postInstallIndex = lines.findIndex((line) => line.includes('post_install do |installer|'));
    if (postInstallIndex === -1) {
        return podfile;
    }
    const insertBefore = lines.findIndex((line, index) => line.trim() === 'end' && index > postInstallIndex);
    if (insertBefore === -1) {
        return podfile;
    }
    lines.splice(insertBefore, 0, FMT_CONSTEVAL_FIX_SNIPPET);
    return lines.join('\n');
}
const withIosFmtConsteval = (config, props) => {
    if (!(0, pluginConfig_1.resolveConfigValue)(props, 'ios', 'buildReactNativeFromSource')) {
        return config;
    }
    return (0, config_plugins_1.withDangerousMod)(config, [
        'ios',
        async (config) => {
            const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
            if (!fs.existsSync(podfilePath)) {
                return config;
            }
            const podfile = fs.readFileSync(podfilePath, 'utf8');
            fs.writeFileSync(podfilePath, addFmtConstevalFix(podfile), 'utf8');
            return config;
        },
    ]);
};
exports.withIosFmtConsteval = withIosFmtConsteval;
const withIosReactNativeReleaseLevel = (config, { reactNativeReleaseLevel }) => {
    return (0, config_plugins_1.withInfoPlist)(config, (config) => {
        config.modResults['ReactNativeReleaseLevel'] = reactNativeReleaseLevel;
        return config;
    });
};
const withIosDeploymentTargetXcodeProject = (config, props) => {
    return (0, config_plugins_1.withXcodeProject)(config, (config) => {
        config.modResults = updateDeploymentTargetXcodeProject(config.modResults, props.deploymentTarget);
        return config;
    });
};
function updateDeploymentTargetXcodeProject(project, deploymentTarget) {
    const { Target } = config_plugins_1.IOSConfig;
    const targetBuildConfigListIds = Target.getNativeTargets(project)
        .filter(([_, target]) => Target.isTargetOfType(target, Target.TargetType.APPLICATION))
        .map(([_, target]) => target.buildConfigurationList);
    for (const buildConfigListId of targetBuildConfigListIds) {
        for (const [, configurations] of config_plugins_1.IOSConfig.XcodeUtils.getBuildConfigurationsForListId(project, buildConfigListId)) {
            const { buildSettings } = configurations;
            if (buildSettings?.IPHONEOS_DEPLOYMENT_TARGET) {
                buildSettings.IPHONEOS_DEPLOYMENT_TARGET = deploymentTarget;
            }
        }
    }
    return project;
}
const withIosDeploymentTargetPodfile = createBuildPodfilePropsConfigPlugin([
    {
        propName: 'ios.deploymentTarget',
        propValueGetter: (config) => config.ios?.deploymentTarget,
    },
], 'withIosDeploymentTargetPodfile');
