"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPrebuiltSettings = exports.addNewPodsTarget = void 0;
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
const addNewPodsTarget = (podfile, targetName) => {
    const targetLines = getTargetNameLines(targetName);
    let podFileLines = podfile.split('\n');
    if (podFileLines.find((line) => line.includes(targetLines[0].trim()))) {
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
    if (podFileLines.find((line) => line.includes(prebuiltSettingsLines[4].trim()))) {
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
