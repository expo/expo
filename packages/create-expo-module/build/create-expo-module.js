"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const chalk_1 = __importDefault(require("chalk"));
const commander_1 = require("commander");
const download_tarball_1 = __importDefault(require("download-tarball"));
const ejs_1 = __importDefault(require("ejs"));
const find_up_1 = __importDefault(require("find-up"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const getenv_1 = require("getenv");
const path_1 = __importDefault(require("path"));
const prompts_1 = __importDefault(require("prompts"));
const createExampleApp_1 = require("./createExampleApp");
const packageManager_1 = require("./packageManager");
const prompts_2 = require("./prompts");
const resolvePackageManager_1 = require("./resolvePackageManager");
const telemetry_1 = require("./telemetry");
const ora_1 = require("./utils/ora");
const debug = require('debug')('create-expo-module:main');
const packageJson = require('../package.json');
// Opt in to using beta versions
const EXPO_BETA = (0, getenv_1.boolish)('EXPO_BETA', false);
// `yarn run` may change the current working dir, then we should use `INIT_CWD` env.
const CWD = process.env.INIT_CWD || process.cwd();
// Ignore some paths. Especially `package.json` as it is rendered
// from `$package.json` file instead of the original one.
const IGNORES_PATHS = [
    '.DS_Store',
    'build',
    'node_modules',
    'package.json',
    '.npmignore',
    '.gitignore',
];
// Url to the documentation on Expo Modules
const DOCS_URL = 'https://docs.expo.dev/modules';
const FYI_LOCAL_DIR = 'https://expo.fyi/expo-module-local-autolinking.md';
async function getCorrectLocalDirectory(targetOrSlug) {
    const packageJsonPath = await (0, find_up_1.default)('package.json', { cwd: CWD });
    if (!packageJsonPath) {
        console.log(chalk_1.default.red.bold('⚠️ This command should be run inside your Expo project when run with the --local flag.'));
        console.log(chalk_1.default.red('For native modules to autolink correctly, you need to place them in the `modules` directory in the root of the project.'));
        return null;
    }
    return path_1.default.join(packageJsonPath, '..', 'modules', targetOrSlug);
}
/**
 * The main function of the command.
 *
 * @param target Path to the directory where to create the module. Defaults to current working dir.
 * @param command An object from `commander`.
 */
async function main(target, options) {
    if (options.local) {
        console.log();
        console.log(`${chalk_1.default.gray('The local module will be created in the ')}${chalk_1.default.gray.bold.italic('modules')} ${chalk_1.default.gray('directory in the root of your project. Learn more: ')}${chalk_1.default.gray.bold(FYI_LOCAL_DIR)}`);
        console.log();
    }
    const slug = await askForPackageSlugAsync(target, options.local);
    const targetDir = options.local
        ? await getCorrectLocalDirectory(target || slug)
        : path_1.default.join(CWD, target || slug);
    if (!targetDir) {
        return;
    }
    await fs_extra_1.default.ensureDir(targetDir);
    await confirmTargetDirAsync(targetDir);
    options.target = targetDir;
    const data = await askForSubstitutionDataAsync(slug, options.local);
    // Make one line break between prompts and progress logs
    console.log();
    const packageManager = await (0, resolvePackageManager_1.resolvePackageManager)();
    const packagePath = options.source
        ? path_1.default.join(CWD, options.source)
        : await downloadPackageAsync(targetDir, options.local);
    (0, telemetry_1.logEventAsync)((0, telemetry_1.eventCreateExpoModule)(packageManager, options));
    await (0, ora_1.newStep)('Creating the module from template files', async (step) => {
        await createModuleFromTemplate(packagePath, targetDir, data);
        step.succeed('Created the module from template files');
    });
    if (!options.local) {
        await (0, ora_1.newStep)('Installing module dependencies', async (step) => {
            await (0, packageManager_1.installDependencies)(packageManager, targetDir);
            step.succeed('Installed module dependencies');
        });
        await (0, ora_1.newStep)('Compiling TypeScript files', async (step) => {
            await (0, spawn_async_1.default)(packageManager, ['run', 'build'], {
                cwd: targetDir,
                stdio: 'ignore',
            });
            step.succeed('Compiled TypeScript files');
        });
    }
    if (!options.source) {
        // Files in the downloaded tarball are wrapped in `package` dir.
        // We should remove it after all.
        await fs_extra_1.default.remove(packagePath);
    }
    if (!options.local && data.type !== 'local') {
        if (!options.withReadme) {
            await fs_extra_1.default.remove(path_1.default.join(targetDir, 'README.md'));
        }
        if (!options.withChangelog) {
            await fs_extra_1.default.remove(path_1.default.join(targetDir, 'CHANGELOG.md'));
        }
        if (options.example) {
            // Create "example" folder
            await (0, createExampleApp_1.createExampleApp)(data, targetDir, packageManager);
        }
        await (0, ora_1.newStep)('Creating an empty Git repository', async (step) => {
            try {
                const result = await createGitRepositoryAsync(targetDir);
                if (result) {
                    step.succeed('Created an empty Git repository');
                }
                else if (result === null) {
                    step.succeed('Skipped creating an empty Git repository, already within a Git repository');
                }
                else if (result === false) {
                    step.warn('Could not create an empty Git repository, see debug logs with EXPO_DEBUG=true');
                }
            }
            catch (e) {
                step.fail(e.toString());
            }
        });
    }
    console.log();
    if (options.local) {
        console.log(`✅ Successfully created Expo module in ${chalk_1.default.bold.italic(`modules/${slug}`)}`);
        printFurtherLocalInstructions(slug, data.project.moduleName);
    }
    else {
        console.log('✅ Successfully created Expo module');
        printFurtherInstructions(targetDir, packageManager, options.example);
    }
}
/**
 * Recursively scans for the files within the directory. Returned paths are relative to the `root` path.
 */
async function getFilesAsync(root, dir = null) {
    const files = [];
    const baseDir = dir ? path_1.default.join(root, dir) : root;
    for (const file of await fs_extra_1.default.readdir(baseDir)) {
        const relativePath = dir ? path_1.default.join(dir, file) : file;
        if (IGNORES_PATHS.includes(relativePath) || IGNORES_PATHS.includes(file)) {
            continue;
        }
        const fullPath = path_1.default.join(baseDir, file);
        const stat = await fs_extra_1.default.lstat(fullPath);
        if (stat.isDirectory()) {
            files.push(...(await getFilesAsync(root, relativePath)));
        }
        else {
            files.push(relativePath);
        }
    }
    return files;
}
/**
 * Asks NPM registry for the url to the tarball.
 */
async function getNpmTarballUrl(packageName, version = 'latest') {
    debug(`Using module template ${chalk_1.default.bold(packageName)}@${chalk_1.default.bold(version)}`);
    const { stdout } = await (0, spawn_async_1.default)('npm', ['view', `${packageName}@${version}`, 'dist.tarball']);
    return stdout.trim();
}
/**
 * Gets expo SDK version major from the local package.json.
 */
async function getLocalSdkMajorVersion() {
    const path = require.resolve('expo/package.json', { paths: [process.cwd()] });
    if (!path) {
        return null;
    }
    const { version } = require(path) ?? {};
    return version?.split('.')[0] ?? null;
}
/**
 * Selects correct version of the template based on the SDK version for local modules and EXPO_BETA flag.
 */
async function getTemplateVersion(isLocal) {
    if (EXPO_BETA) {
        return 'next';
    }
    if (!isLocal) {
        return 'latest';
    }
    try {
        const sdkVersionMajor = await getLocalSdkMajorVersion();
        return sdkVersionMajor ? `sdk-${sdkVersionMajor}` : 'latest';
    }
    catch {
        console.log();
        console.warn(chalk_1.default.yellow("Couldn't determine the SDK version from the local project, using `latest` as the template version."));
        return 'latest';
    }
}
/**
 * Downloads the template from NPM registry.
 */
async function downloadPackageAsync(targetDir, isLocal = false) {
    return await (0, ora_1.newStep)('Downloading module template from npm', async (step) => {
        const templateVersion = await getTemplateVersion(isLocal);
        let tarballUrl = null;
        try {
            tarballUrl = await getNpmTarballUrl(isLocal ? 'expo-module-template-local' : 'expo-module-template', templateVersion);
        }
        catch {
            console.log();
            console.warn(chalk_1.default.yellow("Couldn't download the versioned template from npm, falling back to the latest version."));
            tarballUrl = await getNpmTarballUrl(isLocal ? 'expo-module-template-local' : 'expo-module-template', 'latest');
        }
        await (0, download_tarball_1.default)({
            url: tarballUrl,
            dir: targetDir,
        });
        step.succeed('Downloaded module template from npm');
        return path_1.default.join(targetDir, 'package');
    });
}
function handleSuffix(name, suffix) {
    if (name.endsWith(suffix)) {
        return name;
    }
    return `${name}${suffix}`;
}
/**
 * Creates the module based on the `ejs` template (e.g. `expo-module-template` package).
 */
async function createModuleFromTemplate(templatePath, targetPath, data) {
    const files = await getFilesAsync(templatePath);
    // Iterate through all template files.
    for (const file of files) {
        const renderedRelativePath = ejs_1.default.render(file.replace(/^\$/, ''), data, {
            openDelimiter: '{',
            closeDelimiter: '}',
            escape: (value) => value.replace(/\./g, path_1.default.sep),
        });
        const fromPath = path_1.default.join(templatePath, file);
        const toPath = path_1.default.join(targetPath, renderedRelativePath);
        const template = await fs_extra_1.default.readFile(fromPath, { encoding: 'utf8' });
        const renderedContent = ejs_1.default.render(template, data);
        await fs_extra_1.default.outputFile(toPath, renderedContent, { encoding: 'utf8' });
    }
}
async function createGitRepositoryAsync(targetDir) {
    // Check if we are inside a git repository already
    try {
        await (0, spawn_async_1.default)('git', ['rev-parse', '--is-inside-work-tree'], {
            stdio: 'ignore',
            cwd: targetDir,
        });
        debug(chalk_1.default.dim('New project is already inside of a Git repo, skipping git init.'));
        return null;
    }
    catch (e) {
        if (e.errno === 'ENOENT') {
            debug(chalk_1.default.dim('Unable to initialize Git repo. `git` not in $PATH.'));
            return false;
        }
    }
    // Create a new git repository
    await (0, spawn_async_1.default)('git', ['init'], { stdio: 'ignore', cwd: targetDir });
    await (0, spawn_async_1.default)('git', ['add', '-A'], { stdio: 'ignore', cwd: targetDir });
    const commitMsg = `Initial commit\n\nGenerated by ${packageJson.name} ${packageJson.version}.`;
    await (0, spawn_async_1.default)('git', ['commit', '-m', commitMsg], {
        stdio: 'ignore',
        cwd: targetDir,
    });
    debug(chalk_1.default.dim('Initialized a Git repository.'));
    return true;
}
/**
 * Asks the user for the package slug (npm package name).
 */
async function askForPackageSlugAsync(customTargetPath, isLocal = false) {
    const { slug } = await (0, prompts_1.default)((isLocal ? prompts_2.getLocalFolderNamePrompt : prompts_2.getSlugPrompt)(customTargetPath), {
        onCancel: () => process.exit(0),
    });
    return slug;
}
/**
 * Asks the user for some data necessary to render the template.
 * Some values may already be provided by command options, the prompt is skipped in that case.
 */
async function askForSubstitutionDataAsync(slug, isLocal = false) {
    const promptQueries = await (isLocal ? prompts_2.getLocalSubstitutionDataPrompts : prompts_2.getSubstitutionDataPrompts)(slug);
    // Stop the process when the user cancels/exits the prompt.
    const onCancel = () => {
        process.exit(0);
    };
    const { name, description, package: projectPackage, authorName, authorEmail, authorUrl, repo, } = await (0, prompts_1.default)(promptQueries, { onCancel });
    if (isLocal) {
        return {
            project: {
                slug,
                name,
                package: projectPackage,
                moduleName: handleSuffix(name, 'Module'),
                viewName: handleSuffix(name, 'View'),
            },
            type: 'local',
        };
    }
    return {
        project: {
            slug,
            name,
            version: '0.1.0',
            description,
            package: projectPackage,
            moduleName: handleSuffix(name, 'Module'),
            viewName: handleSuffix(name, 'View'),
        },
        author: `${authorName} <${authorEmail}> (${authorUrl})`,
        license: 'MIT',
        repo,
        type: 'remote',
    };
}
/**
 * Checks whether the target directory is empty and if not, asks the user to confirm if he wants to continue.
 */
async function confirmTargetDirAsync(targetDir) {
    const files = await fs_extra_1.default.readdir(targetDir);
    if (files.length === 0) {
        return;
    }
    const { shouldContinue } = await (0, prompts_1.default)({
        type: 'confirm',
        name: 'shouldContinue',
        message: `The target directory ${chalk_1.default.magenta(targetDir)} is not empty, do you want to continue anyway?`,
        initial: true,
    }, {
        onCancel: () => false,
    });
    if (!shouldContinue) {
        process.exit(0);
    }
}
/**
 * Prints how the user can follow up once the script finishes creating the module.
 */
function printFurtherInstructions(targetDir, packageManager, includesExample) {
    if (includesExample) {
        const commands = [
            `cd ${path_1.default.relative(CWD, targetDir)}`,
            (0, resolvePackageManager_1.formatRunCommand)(packageManager, 'open:ios'),
            (0, resolvePackageManager_1.formatRunCommand)(packageManager, 'open:android'),
        ];
        console.log();
        console.log('To start developing your module, navigate to the directory and open iOS and Android projects of the example app');
        commands.forEach((command) => console.log(chalk_1.default.gray('>'), chalk_1.default.bold(command)));
        console.log();
    }
    console.log(`Learn more on Expo Modules APIs: ${chalk_1.default.blue.bold(DOCS_URL)}`);
}
function printFurtherLocalInstructions(slug, name) {
    console.log();
    console.log(`You can now import this module inside your application.`);
    console.log(`For example, you can add this line to your App.js or App.tsx file:`);
    console.log(`${chalk_1.default.gray.italic(`import { hello } from './modules/${slug}';`)}`);
    console.log();
    console.log(`Learn more on Expo Modules APIs: ${chalk_1.default.blue.bold(DOCS_URL)}`);
    console.log(chalk_1.default.yellow(`Remember you need to rebuild your development client or reinstall pods to see the changes.`));
}
const program = new commander_1.Command();
program
    .name(packageJson.name)
    .version(packageJson.version)
    .description(packageJson.description)
    .arguments('[path]')
    .option('-s, --source <source_dir>', 'Local path to the template. By default it downloads `expo-module-template` from NPM.')
    .option('--with-readme', 'Whether to include README.md file.', false)
    .option('--with-changelog', 'Whether to include CHANGELOG.md file.', false)
    .option('--no-example', 'Whether to skip creating the example app.', false)
    .option('--local', 'Whether to create a local module in the current project, skipping installing node_modules and creating the example directory.', false)
    .action(main);
program
    .hook('postAction', async () => {
    await (0, telemetry_1.getTelemetryClient)().flush?.();
})
    .parse(process.argv);
//# sourceMappingURL=create-expo-module.js.map