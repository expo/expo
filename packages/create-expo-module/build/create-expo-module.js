#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const commander_1 = require("commander");
const download_tarball_1 = __importDefault(require("download-tarball"));
const ejs_1 = __importDefault(require("ejs"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const prompts_1 = __importDefault(require("prompts"));
const packageJson = require('../package.json');
// `yarn run` may change the current working dir, then we should use `INIT_CWD` env.
const cwd = process.env.INIT_CWD || process.cwd();
// Ignore some paths. Especially `package.json` as it is rendered
// from `$package.json` file instead of the original one.
const ignoredPaths = ['.DS_Store', 'build', 'node_modules', 'package.json'];
/**
 * The main function of the command.
 *
 * @param target Path to the directory where to create the module. Defaults to current working dir.
 * @param command An object from `commander`.
 */
async function main(target, options, command) {
    const targetDir = target ? path_1.default.join(cwd, target) : cwd;
    options.target = targetDir;
    await fs_extra_1.default.ensureDir(targetDir);
    const packagePath = options.source
        ? path_1.default.join(cwd, options.source)
        : await downloadPackageAsync(targetDir);
    const files = await getFilesAsync(packagePath);
    const data = await askForSubstitutionDataAsync(targetDir, options);
    // Iterate through all template files.
    for (const file of files) {
        const renderedRelativePath = ejs_1.default.render(file.replace(/^\$/, ''), data, {
            openDelimiter: '{',
            closeDelimiter: '}',
            escape: (value) => value.replace('.', path_1.default.sep),
        });
        const fromPath = path_1.default.join(packagePath, file);
        const toPath = path_1.default.join(targetDir, renderedRelativePath);
        const template = await fs_extra_1.default.readFile(fromPath, { encoding: 'utf8' });
        const renderedContent = ejs_1.default.render(template, data);
        await fs_extra_1.default.outputFile(toPath, renderedContent, { encoding: 'utf8' });
    }
    if (!options.source) {
        // Files in the downloaded tarball are wrapped in `package` dir.
        // We should remove it after all.
        await fs_extra_1.default.remove(packagePath);
    }
    if (!options.withReadme) {
        await fs_extra_1.default.remove(path_1.default.join(targetDir, 'README.md'));
    }
    if (!options.withChangelog) {
        await fs_extra_1.default.remove(path_1.default.join(targetDir, 'CHANGELOG.md'));
    }
    // Build TypeScript files.
    await (0, spawn_async_1.default)('npm', ['run', 'build'], {
        cwd: targetDir,
    });
}
/**
 * Recursively scans for the files within the directory. Returned paths are relative to the `root` path.
 */
async function getFilesAsync(root, dir = null) {
    const files = [];
    const baseDir = dir ? path_1.default.join(root, dir) : root;
    for (const file of await fs_extra_1.default.readdir(baseDir)) {
        const relativePath = dir ? path_1.default.join(dir, file) : file;
        if (ignoredPaths.includes(relativePath) || ignoredPaths.includes(file)) {
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
    const { stdout } = await (0, spawn_async_1.default)('npm', ['view', `${packageName}@${version}`, 'dist.tarball']);
    return stdout.trim();
}
/**
 * Gets the username of currently logged in user. Used as a default in the prompt asking for the module author.
 */
async function npmWhoamiAsync(targetDir) {
    try {
        const { stdout } = await (0, spawn_async_1.default)('npm', ['whoami'], { cwd: targetDir });
        return stdout.trim();
    }
    catch (e) {
        return null;
    }
}
/**
 * Downloads the template from NPM registry.
 */
async function downloadPackageAsync(targetDir) {
    const tarballUrl = await getNpmTarballUrl('expo-module-template');
    await (0, download_tarball_1.default)({
        url: tarballUrl,
        dir: targetDir,
    });
    return path_1.default.join(targetDir, 'package');
}
/**
 * Asks the user for some data necessary to render the template.
 * Some values may already be provided by command options, the prompt is skipped in that case.
 */
async function askForSubstitutionDataAsync(targetDir, options) {
    var _a;
    const defaultPackageSlug = path_1.default.basename(targetDir);
    const defaultProjectName = defaultPackageSlug
        .replace(/^./, (match) => match.toUpperCase())
        .replace(/\W+(\w)/g, (_, p1) => p1.toUpperCase());
    const { slug } = options.target
        ? { slug: defaultPackageSlug }
        : await (0, prompts_1.default)({
            type: 'text',
            name: 'slug',
            message: 'What is the package slug?',
            initial: defaultPackageSlug,
        });
    const { name } = options.name
        ? options
        : await (0, prompts_1.default)({
            type: 'text',
            name: 'name',
            message: 'What is the project name?',
            initial: defaultProjectName,
        });
    const { description } = options.description
        ? options
        : await (0, prompts_1.default)({
            type: 'text',
            name: 'description',
            message: 'How would you describe the module?',
        });
    const { package: projectPackage } = options.package
        ? options
        : await (0, prompts_1.default)({
            type: 'text',
            name: 'package',
            message: 'What is the Android package name?',
            initial: `expo.modules.${defaultPackageSlug.replace(/\W/g, '').toLowerCase()}`,
        });
    const { author } = options.author
        ? options
        : await (0, prompts_1.default)({
            type: 'text',
            name: 'author',
            message: 'Who is the author?',
            initial: (_a = (await npmWhoamiAsync(targetDir))) !== null && _a !== void 0 ? _a : '',
        });
    const { license } = options.license
        ? options
        : await (0, prompts_1.default)({
            type: 'text',
            name: 'license',
            message: 'What is the license?',
            initial: 'MIT',
        });
    const { repo } = options.repo
        ? options
        : await (0, prompts_1.default)({
            type: 'text',
            name: 'repo',
            message: 'What is the repository URL?',
        });
    return {
        project: {
            slug,
            name,
            version: '0.1.0',
            description,
            package: projectPackage,
        },
        author,
        license,
        repo,
    };
}
const program = new commander_1.Command();
program
    .name(packageJson.name)
    .version(packageJson.version)
    .description(packageJson.description)
    .arguments('[target_dir]')
    .option('-s, --source <source_dir>', 'Local path to the template. By default it downloads `expo-module-template` from NPM.')
    .option('-n, --name <module_name>', 'Name of the native module.')
    .option('-d, --description <description>', 'Description of the module.')
    .option('-p, --package <package>', 'The Android package name.')
    .option('-a, --author <author>', 'The author name.')
    .option('-l, --license <license>', 'The license that the module is distributed with.')
    .option('-r, --repo <repo_url>', 'The URL to the repository.')
    .option('--with-readme', 'Whether to include README.md file.', false)
    .option('--with-changelog', 'Whether to include CHANGELOG.md file.', false)
    .action(main);
program.parse(process.argv);
//# sourceMappingURL=create-expo-module.js.map