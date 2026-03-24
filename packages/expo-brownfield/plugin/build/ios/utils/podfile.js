"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPrebuiltSettings = exports.addNewPodsTarget = exports.addManglePlugin = void 0;
const getTargetNameLines = (targetName) => {
    return [`  target '${targetName}' do`, '    inherit! :complete', '  end'];
};
/**
 * Ensure that we disable SWIFT_VERIFY_EMITTED_MODULE_INTERFACE option
 * and include -no-verify-emitted-module-interface in OTHER_SWIFT_FLAGS
 * for all targets in the pods project in order for consuming prebuilt RN
 * frameworks to work
 */
const getPrebuiltSettingsLines = () => {
    return `    installer.pods_project.targets.each do |t|
      t.build_configurations.each do |config|
        config.build_settings['SWIFT_VERIFY_EMITTED_MODULE_INTERFACE'] = 'NO'
        flags = config.build_settings['OTHER_SWIFT_FLAGS'] || '$(inherited)'
        config.build_settings['OTHER_SWIFT_FLAGS'] = "#{flags} -no-verify-emitted-module-interface"
      end
    end`.split('\n');
};
const MANGLE_REQUIRE_LINE = `require File.join(File.dirname(\`node --print "require.resolve('expo-brownfield/package.json')"\`.strip), "ios/scripts/mangle")`;
const getMangleCallLine = (targetName) => {
    return `    mangle_pods(installer, targets: ['${targetName}'], mangle_prefix: '${targetName}_')`;
};
/**
 * Add cocoapods-mangle to the Podfile.
 * This adds a post_install script so that all ObjC symbols in pod dependencies
 * are prefixed, allowing multiple brownfield frameworks to coexist in
 * the same host app without duplicate symbol errors.
 */
const addManglePlugin = (podfile, targetName) => {
    let podFileLines = podfile.split('\n');
    // Insert after existing require/plugin/source lines at the top
    const lastRequireIndex = podFileLines.reduce((acc, line, index) => {
        const trimmed = line.trimStart();
        if (trimmed.startsWith('require ') ||
            trimmed.startsWith('plugin ') ||
            trimmed.startsWith('source ')) {
            return index;
        }
        return acc;
    }, -1);
    podFileLines.splice(lastRequireIndex + 1, 0, MANGLE_REQUIRE_LINE);
    // Add mangle_pods call at the end of post_install block if not already present
    if (!podFileLines.some((line) => line.includes('mangle_pods'))) {
        const postInstallIndex = podFileLines.findIndex((line) => line.includes('post_install do |installer|'));
        if (postInstallIndex !== -1) {
            // Find the closing `end` of the post_install block
            let depth = 0;
            let postInstallEndIndex = -1;
            for (let i = postInstallIndex; i < podFileLines.length; i++) {
                const trimmed = podFileLines[i].trimStart();
                if (trimmed.match(/\bdo\b/) || trimmed.match(/^if\b/) || trimmed.match(/^unless\b/)) {
                    depth++;
                }
                if (trimmed === 'end' || trimmed.startsWith('end ')) {
                    depth--;
                    if (depth === 0) {
                        postInstallEndIndex = i;
                        break;
                    }
                }
            }
            if (postInstallEndIndex !== -1) {
                podFileLines.splice(postInstallEndIndex, 0, getMangleCallLine(targetName));
            }
        }
    }
    return podFileLines.join('\n');
};
exports.addManglePlugin = addManglePlugin;
const addNewPodsTarget = (podfile, targetName) => {
    const targetLines = getTargetNameLines(targetName);
    let podFileLines = podfile.split('\n');
    if (podFileLines.find((line) => targetLines[0] != null && line.includes(targetLines[0].trim()))) {
        console.info(`Target for ${targetName} is already added. Skipping...`);
        return podfile;
    }
    const insertBefore = podFileLines.findLastIndex((line) => line === 'end');
    podFileLines = [
        ...podFileLines.slice(0, insertBefore),
        '', // new line for nicer output
        ...targetLines,
        ...podFileLines.slice(insertBefore),
    ];
    return podFileLines.join('\n');
};
exports.addNewPodsTarget = addNewPodsTarget;
const addPrebuiltSettings = (podfile) => {
    const prebuiltSettingsLines = getPrebuiltSettingsLines();
    let podFileLines = podfile.split('\n');
    if (podFileLines.find((line) => prebuiltSettingsLines[4] != null && line.includes(prebuiltSettingsLines[4].trim()))) {
        console.info('Prebuilt settings are already added. Skipping...');
        return podfile;
    }
    const postInstallIndex = podFileLines.findIndex((line) => line.includes('post_install do |installer|'));
    const insertBefore = podFileLines.findIndex((line, index) => line.includes('end') && index > postInstallIndex);
    podFileLines = [
        ...podFileLines.slice(0, insertBefore),
        '', // new line for nicer output
        ...prebuiltSettingsLines,
        ...podFileLines.slice(insertBefore),
    ];
    return podFileLines.join('\n');
};
exports.addPrebuiltSettings = addPrebuiltSettings;
