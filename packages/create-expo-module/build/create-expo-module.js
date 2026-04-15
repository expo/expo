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
const fs_1 = __importDefault(require("fs"));
const getenv_1 = require("getenv");
const path_1 = __importDefault(require("path"));
const prompts_1 = __importDefault(require("prompts"));
const validate_npm_package_name_1 = __importDefault(require("validate-npm-package-name"));
const createExampleApp_1 = require("./createExampleApp");
const packageManager_1 = require("./packageManager");
const prompts_2 = require("./prompts");
const resolvePackageManager_1 = require("./resolvePackageManager");
const telemetry_1 = require("./telemetry");
const git_1 = require("./utils/git");
const github_1 = require("./utils/github");
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
/**
 * Determines if we're in an interactive environment.
 * Non-interactive when: CI=1/true or non-TTY stdin.
 */
function isInteractive() {
    // Check for CI environment
    const ci = process.env.CI;
    if (ci === '1' || ci === 'true' || ci?.toLowerCase() === 'true') {
        return false;
    }
    // Check for TTY
    if (!process.stdin.isTTY) {
        return false;
    }
    return true;
}
/**
 * Converts a slug to a native module name (PascalCase).
 */
function slugToModuleName(slug) {
    return slug
        .replace(/^@/, '')
        .replace(/^./, (match) => match.toUpperCase())
        .replace(/\W+(\w)/g, (_, p1) => p1.toUpperCase());
}
/**
 * Converts a slug to an Android package name.
 */
function slugToAndroidPackage(slug) {
    const namespace = slug
        .replace(/\W/g, '')
        .replace(/^(expo|reactnative)/, '')
        .toLowerCase();
    return `expo.modules.${namespace}`;
}
async function getCorrectLocalDirectory(targetOrSlug) {
    let packageJsonPath = null;
    for (let dir = CWD; path_1.default.dirname(dir) !== dir; dir = path_1.default.dirname(dir)) {
        const file = path_1.default.resolve(dir, 'package.json');
        if (fs_1.default.existsSync(file)) {
            packageJsonPath = file;
            break;
        }
    }
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
 * @param options An options object for `commander`.
 */
async function main(target, options) {
    const interactive = isInteractive();
    if (!interactive) {
        debug('Running in non-interactive mode');
    }
    if (options.local) {
        console.log();
        console.log(`${chalk_1.default.gray('The local module will be created in the ')}${chalk_1.default.gray.bold.italic('modules')} ${chalk_1.default.gray('directory in the root of your project. Learn more: ')}${chalk_1.default.gray.bold(FYI_LOCAL_DIR)}`);
        console.log();
    }
    const slug = await askForPackageSlugAsync(target, options.local, options);
    const targetDir = options.local
        ? await getCorrectLocalDirectory(target || slug)
        : path_1.default.join(CWD, target || slug);
    if (!targetDir) {
        return;
    }
    await fs_1.default.promises.mkdir(targetDir, { recursive: true });
    await confirmTargetDirAsync(targetDir, options);
    options.target = targetDir;
    const data = await askForSubstitutionDataAsync(slug, options.local, options);
    // Make one line break between prompts and progress logs
    console.log();
    const packageManager = (0, resolvePackageManager_1.resolvePackageManager)();
    const packagePath = options.source
        ? path_1.default.join(CWD, options.source)
        : await downloadPackageAsync(targetDir, options.local);
    await (0, telemetry_1.logEventAsync)((0, telemetry_1.eventCreateExpoModule)(packageManager, options));
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
        await fs_1.default.promises.rm(packagePath, { recursive: true, force: true });
    }
    if (!options.local && data.type !== 'local') {
        if (!options.withReadme) {
            await fs_1.default.promises.rm(path_1.default.join(targetDir, 'README.md'), { force: true });
        }
        if (!options.withChangelog) {
            await fs_1.default.promises.rm(path_1.default.join(targetDir, 'CHANGELOG.md'), { force: true });
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
            catch (error) {
                step.fail(error.toString());
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
    for (const file of await fs_1.default.promises.readdir(baseDir)) {
        const relativePath = dir ? path_1.default.join(dir, file) : file;
        if (IGNORES_PATHS.includes(relativePath) || IGNORES_PATHS.includes(file)) {
            continue;
        }
        const fullPath = path_1.default.join(baseDir, file);
        const stat = await fs_1.default.promises.lstat(fullPath);
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
        const packageName = isLocal ? 'expo-module-template-local' : 'expo-module-template';
        try {
            await (0, download_tarball_1.default)({
                url: await getNpmTarballUrl(packageName, templateVersion),
                dir: targetDir,
            });
        }
        catch {
            console.log();
            console.warn(chalk_1.default.yellow("Couldn't download the versioned template from npm, falling back to the latest version."));
            await (0, download_tarball_1.default)({
                url: await getNpmTarballUrl(packageName, 'latest'),
                dir: targetDir,
            });
        }
        step.succeed('Downloaded module template from npm registry.');
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
        const template = await fs_1.default.promises.readFile(fromPath, 'utf8');
        const renderedContent = ejs_1.default.render(template, data);
        if (!fs_1.default.existsSync(path_1.default.dirname(toPath))) {
            await fs_1.default.promises.mkdir(path_1.default.dirname(toPath), { recursive: true });
        }
        await fs_1.default.promises.writeFile(toPath, renderedContent, 'utf8');
    }
}
async function createGitRepositoryAsync(targetDir) {
    // Check if we are inside a git repository already
    try {
        await (0, spawn_async_1.default)('git', ['rev-parse', '--is-inside-work-tree'], {
            stdio: 'ignore',
            cwd: targetDir,
        });
        debug(chalk_1.default.dim('New project is already inside of a Git repository, skipping `git init`.'));
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
 * In non-interactive mode, uses the target path or 'my-module' as default.
 */
async function askForPackageSlugAsync(customTargetPath, isLocal, options) {
    const interactive = isInteractive();
    // In non-interactive mode, derive slug from target path or use default
    if (!interactive) {
        const targetBasename = customTargetPath && path_1.default.basename(customTargetPath);
        const slug = targetBasename && (0, validate_npm_package_name_1.default)(targetBasename).validForNewPackages
            ? targetBasename
            : 'my-module';
        debug(`Non-interactive mode: using slug "${slug}"`);
        return slug;
    }
    const { slug } = await (0, prompts_1.default)((isLocal ? prompts_2.getLocalFolderNamePrompt : prompts_2.getSlugPrompt)(customTargetPath), {
        onCancel: () => process.exit(0),
    });
    return slug;
}
/**
 * Asks the user for some data necessary to render the template.
 * Some values may already be provided by command options, the prompt is skipped in that case.
 * In non-interactive mode, uses defaults or CLI-provided values.
 */
async function askForSubstitutionDataAsync(slug, isLocal, options) {
    const interactive = isInteractive();
    // Non-interactive mode: use CLI options and defaults
    if (!interactive) {
        return getSubstitutionDataFromOptions(slug, isLocal, options);
    }
    // Interactive mode: prompt for values, but skip prompts for CLI-provided values
    const promptQueries = await (isLocal ? prompts_2.getLocalSubstitutionDataPrompts : prompts_2.getSubstitutionDataPrompts)(slug);
    // Filter out prompts for values already provided via CLI
    const filteredPrompts = promptQueries.filter((prompt) => {
        const name = prompt.name;
        const cliValue = getCliValueForPrompt(name, options);
        return cliValue === undefined;
    });
    // Stop the process when the user cancels/exits the prompt.
    const onCancel = () => {
        process.exit(0);
    };
    // Get values from prompts
    const promptedValues = filteredPrompts.length > 0 ? await (0, prompts_1.default)(filteredPrompts, { onCancel }) : {};
    // Merge CLI-provided values with prompted values
    const name = options.name ?? promptedValues.name ?? slugToModuleName(slug);
    const projectPackage = options.package ?? promptedValues.package ?? slugToAndroidPackage(slug);
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
    const description = options.description ?? promptedValues.description ?? 'My new module';
    const authorName = options.authorName ?? promptedValues.authorName ?? (await (0, git_1.findMyName)()) ?? '';
    const authorEmail = options.authorEmail ?? promptedValues.authorEmail ?? (await (0, git_1.findGitHubEmail)()) ?? '';
    const authorUrl = options.authorUrl ??
        promptedValues.authorUrl ??
        (authorEmail ? ((await (0, github_1.findGitHubUserFromEmail)(authorEmail)) ?? '') : '');
    const repo = options.repo ?? promptedValues.repo ?? (await (0, github_1.guessRepoUrl)(authorUrl, slug)) ?? '';
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
 * Gets the CLI value for a given prompt name.
 */
function getCliValueForPrompt(promptName, options) {
    switch (promptName) {
        case 'name':
            return options.name;
        case 'description':
            return options.description;
        case 'package':
            return options.package;
        case 'authorName':
            return options.authorName;
        case 'authorEmail':
            return options.authorEmail;
        case 'authorUrl':
            return options.authorUrl;
        case 'repo':
            return options.repo;
        default:
            return undefined;
    }
}
/**
 * Gets substitution data from CLI options and defaults (for non-interactive mode).
 */
async function getSubstitutionDataFromOptions(slug, isLocal, options) {
    const name = options.name ?? slugToModuleName(slug);
    const projectPackage = options.package ?? slugToAndroidPackage(slug);
    debug(`Non-interactive mode: name="${name}", package="${projectPackage}"`);
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
    // For remote modules, resolve author info
    const description = options.description ?? 'My new module';
    const authorName = options.authorName ?? (await (0, git_1.findMyName)()) ?? '';
    const authorEmail = options.authorEmail ?? (await (0, git_1.findGitHubEmail)()) ?? '';
    const authorUrl = options.authorUrl ?? (authorEmail ? ((await (0, github_1.findGitHubUserFromEmail)(authorEmail)) ?? '') : '');
    const repo = options.repo ?? (await (0, github_1.guessRepoUrl)(authorUrl, slug)) ?? '';
    debug(`Non-interactive mode: description="${description}", authorName="${authorName}", authorEmail="${authorEmail}", authorUrl="${authorUrl}", repo="${repo}"`);
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
 * In non-interactive mode, automatically continues (assumes intent to overwrite).
 */
async function confirmTargetDirAsync(targetDir, options) {
    const files = await fs_1.default.promises.readdir(targetDir);
    if (files.length === 0) {
        return;
    }
    // In non-interactive mode, proceed automatically
    if (!isInteractive()) {
        debug(`Non-interactive mode: target directory "${targetDir}" is not empty, continuing anyway`);
        console.log(chalk_1.default.yellow(`Warning: Target directory ${chalk_1.default.magenta(targetDir)} is not empty, continuing anyway.`));
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
        console.log('To start developing your module, navigate to the directory and open Android and iOS projects of the example app');
        commands.forEach((command) => console.log(chalk_1.default.gray('>'), chalk_1.default.bold(command)));
        console.log();
    }
    console.log(`Learn more on Expo Modules APIs: ${chalk_1.default.blue.bold(DOCS_URL)}`);
}
function printFurtherLocalInstructions(slug, name) {
    console.log();
    console.log(`You can now import this module inside your application.`);
    console.log(`For example, you can add this line to your App.tsx or App.js file:`);
    console.log(`${chalk_1.default.gray.italic(`import ${name} from './modules/${slug}';`)}`);
    console.log();
    console.log(`Learn more on Expo Modules APIs: ${chalk_1.default.blue.bold(DOCS_URL)}`);
    console.log(chalk_1.default.yellow(`Remember to re-build your native app (for example, with ${chalk_1.default.bold('npx expo run')}) when you make changes to the module. Native code changes are not reloaded with Fast Refresh.`));
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
    // Module configuration options (skip prompts when provided)
    .option('--name <name>', 'Native module name (e.g., MyModule).')
    .option('--description <description>', 'Module description.')
    .option('--package <package>', 'Android package name (e.g., expo.modules.mymodule).')
    .option('--author-name <name>', 'Author name for package.json.')
    .option('--author-email <email>', 'Author email for package.json.')
    .option('--author-url <url>', "URL to the author's profile (e.g., GitHub profile).")
    .option('--repo <url>', 'URL of the repository.')
    .action(main);
program
    .hook('postAction', async () => {
    await (0, telemetry_1.getTelemetryClient)().flush?.();
})
    .parse(process.argv);
//# sourceMappingURL=create-expo-module.js.map