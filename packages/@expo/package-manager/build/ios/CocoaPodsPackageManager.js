"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImprovedPodInstallError = exports.getPodRepoUpdateMessage = exports.getPodUpdateMessage = exports.CocoaPodsBundlerPackageManager = exports.CocoaPodsPackageManager = exports.extractMissingDependencyError = exports.CocoaPodsError = void 0;
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = require("fs");
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const spawn_1 = require("../utils/spawn");
class CocoaPodsError extends Error {
    code;
    cause;
    name = 'CocoaPodsError';
    isPackageManagerError = true;
    constructor(message, code, cause) {
        super(cause ? `${message}\n└─ Cause: ${cause.message}` : message);
        this.code = code;
        this.cause = cause;
    }
}
exports.CocoaPodsError = CocoaPodsError;
function extractMissingDependencyError(errorOutput) {
    // [!] Unable to find a specification for `expo-dev-menu-interface` depended upon by `expo-dev-launcher`
    const results = errorOutput.match(/Unable to find a specification for ['"`]([\w-_\d\s]+)['"`] depended upon by ['"`]([\w-_\d\s]+)['"`]/);
    if (results) {
        return [results[1], results[2]];
    }
    return null;
}
exports.extractMissingDependencyError = extractMissingDependencyError;
class CocoaPodsPackageManager {
    options;
    silent;
    nonInteractive;
    static getPodProjectRoot(projectRoot) {
        if (CocoaPodsPackageManager.isUsingPods(projectRoot))
            return projectRoot;
        const iosProject = path_1.default.join(projectRoot, 'ios');
        if (CocoaPodsPackageManager.isUsingPods(iosProject))
            return iosProject;
        const macOsProject = path_1.default.join(projectRoot, 'macos');
        if (CocoaPodsPackageManager.isUsingPods(macOsProject))
            return macOsProject;
        return null;
    }
    static isUsingPods(projectRoot) {
        return (0, fs_1.existsSync)(path_1.default.join(projectRoot, 'Podfile'));
    }
    // Visible for testing
    static isUsingRubyBundler(projectRoot) {
        return (0, fs_1.existsSync)(path_1.default.join(projectRoot, 'Gemfile'));
    }
    static create(projectRoot, props) {
        if (this.isUsingRubyBundler(projectRoot)) {
            return new CocoaPodsBundlerPackageManager(props);
        }
        else {
            return new CocoaPodsPackageManager(props);
        }
    }
    async gemInstallCLIAsync() {
        const options = ['install', 'cocoapods', '--no-document'];
        try {
            // In case the user has run sudo before running the command we can properly install CocoaPods without prompting for an interaction.
            await (0, spawn_async_1.default)('gem', options, this.options);
        }
        catch (error) {
            if (this.nonInteractive) {
                throw new CocoaPodsError('Failed to install CocoaPods CLI with gem (recommended)', 'COMMAND_FAILED', error);
            }
            // If the user doesn't have permission then we can prompt them to use sudo.
            await (0, spawn_1.spawnSudoAsync)(['gem', ...options], this.options);
        }
    }
    async brewLinkCLIAsync() {
        await (0, spawn_async_1.default)('brew', ['link', 'cocoapods'], this.options);
    }
    async brewInstallCLIAsync() {
        await (0, spawn_async_1.default)('brew', ['install', 'cocoapods'], this.options);
    }
    async installCLIAsync() {
        try {
            !this.silent && console.log(`\u203A Attempting to install CocoaPods CLI with Gem`);
            await this.gemInstallCLIAsync();
            !this.silent && console.log(`\u203A Successfully installed CocoaPods CLI with Gem`);
            return true;
        }
        catch (error) {
            if (!this.silent) {
                console.log(chalk_1.default.yellow(`\u203A Failed to install CocoaPods CLI with Gem`));
                console.log(chalk_1.default.red(error.stderr ?? error.message));
                console.log(`\u203A Attempting to install CocoaPods CLI with Homebrew`);
            }
            try {
                await this.brewInstallCLIAsync();
                if (!(await this.isCLIInstalledAsync())) {
                    try {
                        await this.brewLinkCLIAsync();
                        // Still not available after linking? Bail out
                        if (!(await this.isCLIInstalledAsync())) {
                            throw new CocoaPodsError('CLI could not be installed automatically with gem or Homebrew, please install CocoaPods manually and try again', 'NO_CLI', error);
                        }
                    }
                    catch (error) {
                        throw new CocoaPodsError('Homebrew installation appeared to succeed but CocoaPods CLI not found in PATH and unable to link.', 'NO_CLI', error);
                    }
                }
                !this.silent && console.log(`\u203A Successfully installed CocoaPods CLI with Homebrew`);
                return true;
            }
            catch (error) {
                !this.silent &&
                    console.warn(chalk_1.default.yellow(`\u203A Failed to install CocoaPods with Homebrew. Please install CocoaPods CLI manually and try again.`));
                throw new CocoaPodsError(`Failed to install CocoaPods with Homebrew. Please install CocoaPods CLI manually and try again.`, 'NO_CLI', error);
            }
        }
    }
    static isAvailable(projectRoot, silent) {
        if (process.platform !== 'darwin') {
            !silent && console.log(chalk_1.default.red('CocoaPods is only supported on macOS machines'));
            return false;
        }
        if (!CocoaPodsPackageManager.isUsingPods(projectRoot)) {
            !silent && console.log(chalk_1.default.yellow('CocoaPods is not supported in this project'));
            return false;
        }
        return true;
    }
    async isCLIInstalledAsync(spawnOptions = { stdio: 'inherit' }) {
        try {
            return (await this.versionAsync()).length > 0;
        }
        catch {
            return false;
        }
    }
    constructor({ cwd, silent, nonInteractive, spawnOptions }) {
        this.silent = !!silent;
        this.nonInteractive = !!nonInteractive;
        this.options = {
            cwd,
            // We use pipe by default instead of inherit so that we can capture stderr/stdout and process it for errors.
            // Later we'll also pipe the stdout/stderr to the terminal when silent is false.
            stdio: 'pipe',
            ...(spawnOptions ?? {}),
        };
    }
    get name() {
        return 'CocoaPods';
    }
    /** Runs `pod install` and attempts to automatically run known troubleshooting steps automatically. */
    async installAsync({ spinner } = {}) {
        await this._installAsync({ spinner });
    }
    async handleInstallErrorAsync({ error, shouldUpdate = true, updatedPackages = [], spinner, }) {
        // Unknown errors are rethrown.
        if (!error.output) {
            throw error;
        }
        // To emulate a `pod install --repo-update` error, enter your `ios/Podfile.lock` and change one of `PODS` version numbers to some lower value.
        // const isPodRepoUpdateError = shouldPodRepoUpdate(output);
        if (!shouldUpdate) {
            // If we can't automatically fix the error, we'll just rethrow it with some known troubleshooting info.
            throw getImprovedPodInstallError(error, {
                cwd: this.options.cwd,
            });
        }
        // Collect all of the spawn info.
        const errorOutput = error.output.join(os_1.default.EOL).trim();
        // Extract useful information from the error message and push it to the spinner.
        const { updatePackage, shouldUpdateRepo } = getPodUpdateMessage(errorOutput);
        if (!updatePackage || updatedPackages.includes(updatePackage)) {
            // `pod install --repo-update`...
            // Attempt to install again but this time with install --repo-update enabled.
            return await this._installAsync({
                spinner,
                shouldRepoUpdate: true,
                // Include a boolean to ensure pod install --repo-update isn't invoked in the unlikely case where the pods fail to update.
                shouldUpdate: false,
                updatedPackages,
            });
        }
        // Store the package we should update to prevent a loop.
        updatedPackages.push(updatePackage);
        // If a single package is broken, we'll try to update it.
        // You can manually test this by changing a version number in your `Podfile.lock`.
        // Attempt `pod update <package> <--no-repo-update>` and then try again.
        return await this.runInstallTypeCommandAsync(['update', updatePackage, shouldUpdateRepo ? '' : '--no-repo-update'].filter(Boolean), {
            formatWarning() {
                const updateMessage = `Failed to update ${chalk_1.default.bold(updatePackage)}. Attempting to update the repo instead.`;
                return updateMessage;
            },
            spinner,
            updatedPackages,
        });
        // // If update succeeds, we'll try to install again (skipping `pod install --repo-update`).
        // return await this._installAsync({
        //   spinner,
        //   shouldUpdate: false,
        //   updatedPackages,
        // });
    }
    async _installAsync({ shouldRepoUpdate, ...props } = {}) {
        return await this.runInstallTypeCommandAsync(['install', shouldRepoUpdate ? '--repo-update' : ''].filter(Boolean), {
            formatWarning(error) {
                // Extract useful information from the error message and push it to the spinner.
                return getPodRepoUpdateMessage(error.output.join(os_1.default.EOL).trim()).message;
            },
            ...props,
        });
    }
    async runInstallTypeCommandAsync(command, { formatWarning, ...props } = {}) {
        try {
            return await this._runAsync(command);
        }
        catch (error) {
            if (formatWarning) {
                const warning = formatWarning(error);
                if (props.spinner) {
                    props.spinner.text = chalk_1.default.bold(warning);
                }
                if (!this.silent) {
                    console.warn(chalk_1.default.yellow(warning));
                }
            }
            return await this.handleInstallErrorAsync({ error, ...props });
        }
    }
    // Exposed for testing
    spawnPodCommandAsync(args, options) {
        return (0, spawn_async_1.default)('pod', args, options);
    }
    podCommandForDisplay() {
        return 'pod';
    }
    async addWithParametersAsync(names, parameters) {
        throw new Error('Unimplemented');
    }
    addAsync(names = []) {
        throw new Error('Unimplemented');
    }
    addDevAsync(names = []) {
        throw new Error('Unimplemented');
    }
    addGlobalAsync(names = []) {
        throw new Error('Unimplemented');
    }
    removeAsync(names = []) {
        throw new Error('Unimplemented');
    }
    removeDevAsync(names = []) {
        throw new Error('Unimplemented');
    }
    removeGlobalAsync(names = []) {
        throw new Error('Unimplemented');
    }
    async versionAsync() {
        const { stdout } = await this.spawnPodCommandAsync(['--version'], this.options);
        return stdout.trim();
    }
    async configAsync(key) {
        throw new Error('Unimplemented');
    }
    async removeLockfileAsync() {
        throw new Error('Unimplemented');
    }
    async uninstallAsync() {
        throw new Error('Unimplemented');
    }
    // Exposed for testing
    async _runAsync(args) {
        if (!this.silent) {
            console.log(`> ${this.podCommandForDisplay} ${args.join(' ')}`);
        }
        const promise = this.spawnPodCommandAsync([
            ...args,
            // Enables colors while collecting output.
            '--ansi',
        ], {
            // Add the cwd and other options to the spawn options.
            ...this.options,
            // We use pipe by default instead of inherit so that we can capture stderr/stdout and process it for errors.
            // This is particularly required for the `pod install --repo-update` error.
            // Later we'll also pipe the stdout/stderr to the terminal when silent is false,
            // currently this means we lose out on the ansi colors unless passing the `--ansi` flag to every command.
            stdio: 'pipe',
        });
        if (!this.silent) {
            // If not silent, pipe the stdout/stderr to the terminal.
            // We only do this when the `stdio` is set to `pipe` (collect the results for parsing), `inherit` won't contain `promise.child`.
            if (promise.child.stdout) {
                promise.child.stdout.pipe(process.stdout);
            }
        }
        return await promise;
    }
}
exports.CocoaPodsPackageManager = CocoaPodsPackageManager;
class CocoaPodsBundlerPackageManager extends CocoaPodsPackageManager {
    async installCLIAsync() {
        !this.silent && console.log(`\u203A Attempting to install CocoaPods CLI with Bundler`);
        try {
            await this.rubyBundlerInstallCLIAsync();
        }
        catch (error) {
            if (!this.silent) {
                console.log(chalk_1.default.yellow(`\u203A Failed to install CocoaPods CLI with Bundler`));
                console.log(chalk_1.default.red(error.stderr ?? error.message));
            }
            throw new CocoaPodsError('CLI could not be installed automatically with bundler, please install Gems manually(`bundle install`) and try again', 'NO_CLI', error);
        }
        if (await this.isCLIInstalledAsync()) {
            !this.silent && console.log(`\u203A Successfully installed CocoaPods CLI with Bundler`);
            return true;
        }
        else {
            !this.silent &&
                console.log(chalk_1.default.red(`\u203A Failed to install CocoaPods CLI with Bundler. Make sure cocoapods is in your Gemfile`));
            throw new CocoaPodsError('`bundle install` appeared to succeed but CocoaPods CLI not found in PATH and unable to link.', 'NO_CLI');
        }
    }
    async rubyBundlerInstallCLIAsync() {
        await (0, spawn_async_1.default)('bundle', ['install'], this.options);
    }
    spawnPodCommandAsync(args, options) {
        return (0, spawn_async_1.default)('bundle', ['exec', 'pod', ...(args ?? [])], options);
    }
    podCommandForDisplay() {
        return 'bundle exec pod';
    }
}
exports.CocoaPodsBundlerPackageManager = CocoaPodsBundlerPackageManager;
/** When pods are outdated, they'll throw an error informing you to run "pod install --repo-update" */
function shouldPodRepoUpdate(errorOutput) {
    const output = errorOutput;
    const isPodRepoUpdateError = output.includes('pod repo update') || output.includes('--no-repo-update');
    return isPodRepoUpdateError;
}
function getPodUpdateMessage(output) {
    const props = output.match(/run ['"`]pod update ([\w-_\d/]+)( --no-repo-update)?['"`] to apply changes/);
    return {
        updatePackage: props?.[1] ?? null,
        shouldUpdateRepo: !props?.[2],
    };
}
exports.getPodUpdateMessage = getPodUpdateMessage;
function getPodRepoUpdateMessage(errorOutput) {
    const warningInfo = extractMissingDependencyError(errorOutput);
    const brokenPackage = getPodUpdateMessage(errorOutput);
    let message;
    if (warningInfo) {
        message = `Couldn't install: ${warningInfo[1]} » ${chalk_1.default.underline(warningInfo[0])}.`;
    }
    else if (brokenPackage?.updatePackage) {
        message = `Couldn't install: ${brokenPackage?.updatePackage}.`;
    }
    else {
        message = `Couldn't install Pods.`;
    }
    message += ` Updating the Pods project and trying again...`;
    return { message, ...brokenPackage };
}
exports.getPodRepoUpdateMessage = getPodRepoUpdateMessage;
/**
 * Format the CocoaPods CLI install error.
 *
 * @param error Error from CocoaPods CLI `pod install` command.
 * @returns
 */
function getImprovedPodInstallError(error, { cwd = process.cwd() }) {
    // Collect all of the spawn info.
    const errorOutput = error.output.join(os_1.default.EOL).trim();
    if (error.stdout.match(/No [`'"]Podfile[`'"] found in the project directory/)) {
        // Ran pod install but no Podfile was found.
        error.message = `No Podfile found in directory: ${cwd}. Ensure CocoaPods is setup any try again.`;
    }
    else if (shouldPodRepoUpdate(errorOutput)) {
        // Ran pod install but the install --repo-update step failed.
        const warningInfo = extractMissingDependencyError(errorOutput);
        let reason;
        if (warningInfo) {
            reason = `Couldn't install: ${warningInfo[1]} » ${chalk_1.default.underline(warningInfo[0])}`;
        }
        else {
            reason = `This is often due to native package versions mismatching`;
        }
        // Attempt to provide a helpful message about the missing NPM dependency (containing a CocoaPod) since React Native
        // developers will almost always be using autolinking and not interacting with CocoaPods directly.
        let solution;
        if (warningInfo?.[0]) {
            // If the missing package is named `expo-dev-menu`, `react-native`, etc. then it might not be installed in the project.
            if (warningInfo[0].match(/^(?:@?expo|@?react)(-|\/)/)) {
                solution = `Ensure the node module "${warningInfo[0]}" is installed in your project, then run 'npx pod-install' to try again.`;
            }
            else {
                solution = `Ensure the CocoaPod "${warningInfo[0]}" is installed in your project, then run 'npx pod-install' to try again.`;
            }
        }
        else {
            // Brute force
            solution = `Try deleting the 'ios/Pods' folder or the 'ios/Podfile.lock' file and running 'npx pod-install' to resolve.`;
        }
        error.message = `${reason}. ${solution}`;
        // Attempt to provide the troubleshooting info from CocoaPods CLI at the bottom of the error message.
        if (error.stdout) {
            const cocoapodsDebugInfo = error.stdout.split(os_1.default.EOL);
            // The troubleshooting info starts with `[!]`, capture everything after that.
            const firstWarning = cocoapodsDebugInfo.findIndex((v) => v.startsWith('[!]'));
            if (firstWarning !== -1) {
                const warning = cocoapodsDebugInfo.slice(firstWarning).join(os_1.default.EOL);
                error.message += `\n\n${chalk_1.default.gray(warning)}`;
            }
        }
        return new CocoaPodsError('Command `pod install --repo-update` failed.', 'COMMAND_FAILED', error);
    }
    else {
        let stderr = error.stderr.trim();
        // CocoaPods CLI prints the useful error to stdout...
        const usefulError = error.stdout.match(/\[!\]\s((?:.|\n)*)/)?.[1];
        // If there is a useful error message then prune the less useful info.
        if (usefulError) {
            // Delete unhelpful CocoaPods CLI error message.
            if (error.message?.match(/pod exited with non-zero code: 1/)) {
                error.message = '';
            }
            stderr = null;
        }
        error.message = [usefulError, error.message, stderr].filter(Boolean).join('\n');
    }
    return new CocoaPodsError('Command `pod install` failed.', 'COMMAND_FAILED', error);
}
exports.getImprovedPodInstallError = getImprovedPodInstallError;
//# sourceMappingURL=CocoaPodsPackageManager.js.map