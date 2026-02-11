"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addRepository = void 0;
const node_path_1 = __importDefault(require("node:path"));
const repositoryTemplates = {
    localMaven: () => ['    localDefault {', '        type = "localMaven"', '    }'],
    localDirectory: (count, publication, projectRoot) => {
        const nameOrPlaceholder = publication.name ?? `localDirectory${count + 1}`;
        return [
            `    ${nameOrPlaceholder} {`,
            '        type = "localDirectory"',
            `        url = "file://${standardizePath(publication.path, projectRoot)}"`,
            '    }',
        ];
    },
    remotePublic: (count, publication, _projectRoot) => {
        const nameOrPlaceholder = publication.name ?? `remotePublic${count + 1}`;
        return [
            `    ${nameOrPlaceholder} {`,
            '        type = "remotePublic"',
            `        url = "${publication.url}"`,
            `        allowInsecure = ${publication.allowInsecure}`,
            '    }',
        ];
    },
    remotePrivate: (count, publication, _projectRoot) => {
        const nameOrPlaceholder = publication.name ?? `remotePrivate${count + 1}`;
        return [
            `    ${nameOrPlaceholder} {`,
            '        type = "remotePrivate"',
            `        url = "${publication.url}"`,
            `        username = "${publication.username}"`,
            `        password = "${publication.password}"`,
            `        allowInsecure = ${publication.allowInsecure}`,
            '    }',
        ];
    },
};
const addRepository = (lines, projectRoot, publication) => {
    switch (publication.type) {
        case 'localMaven':
            return countOccurences(lines, 'localDefault') > 0 ? [] : repositoryTemplates.localMaven();
        case 'localDirectory':
        case 'remotePublic':
        case 'remotePrivate':
            if (publication.type === 'remotePrivate') {
                publication = resolveEnv(publication);
            }
            return repositoryTemplates[publication.type](countOccurences(lines, `type = "${publication.type}"`), 
            // @ts-expect-error - TypeScript can't narrow union in fall-through case
            publication, projectRoot);
        default:
            // @ts-expect-error - Non-existent, invalid publication type
            console.warn(`Unknown publication type: "${publication.type}"`);
            return [];
    }
};
exports.addRepository = addRepository;
const countOccurences = (lines, pattern) => {
    return lines.filter((line) => line.includes(pattern)).length;
};
const standardizePath = (url, projectRoot) => {
    return node_path_1.default.isAbsolute(url) ? url : node_path_1.default.join(projectRoot, url);
};
const resolveEnv = (publication) => {
    const publicationInternal = {
        ...publication,
    };
    if (typeof publication.url === 'object') {
        publicationInternal.url = findEnvOrThrow(publication.url.variable);
    }
    if (typeof publication.username === 'object') {
        publicationInternal.username = findEnvOrThrow(publication.username.variable);
    }
    if (typeof publication.password === 'object') {
        publicationInternal.password = findEnvOrThrow(publication.password.variable);
    }
    return publicationInternal;
};
const findEnvOrThrow = (envVariable) => {
    if (process.env[envVariable]) {
        return process.env[envVariable];
    }
    throw new Error(`Environment variable: "${envVariable}" used to define publishing configuration not found`);
};
