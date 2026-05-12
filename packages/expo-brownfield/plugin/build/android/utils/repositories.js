"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addRepository = void 0;
const node_path_1 = __importDefault(require("node:path"));
const repositoryTemplates = {
    localMaven: () => ['    localDefault {', '        type.set("localMaven")', '    }'],
    localDirectory: (count, publication, projectRoot) => {
        const nameOrPlaceholder = publication.name ?? `localDirectory${count + 1}`;
        return [
            `    ${nameOrPlaceholder} {`,
            '        type.set("localDirectory")',
            `        url.set("file://${standardizePath(publication.path, projectRoot)}")`,
            '    }',
        ];
    },
    remotePublic: (count, publication, _projectRoot) => {
        const nameOrPlaceholder = publication.name ?? `remotePublic${count + 1}`;
        return [
            `    ${nameOrPlaceholder} {`,
            '        type.set("remotePublic")',
            setProperty('url', publication.url),
            `        allowInsecure.set(${publication.allowInsecure ?? false})`,
            '    }',
        ];
    },
    remotePrivate: (count, publication, _projectRoot) => {
        const nameOrPlaceholder = publication.name ?? `remotePrivate${count + 1}`;
        return [
            `    ${nameOrPlaceholder} {`,
            '        type.set("remotePrivate")',
            setProperty('url', publication.url),
            setProperty('username', publication.username),
            setProperty('password', publication.password),
            `        allowInsecure.set(${publication.allowInsecure ?? false})`,
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
            return repositoryTemplates[publication.type](countOccurences(lines, `type.set("${publication.type}")`), 
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
const setProperty = (property, value) => {
    if (typeof value === 'string') {
        return `        ${property}.set("${value}")`;
    }
    return `        ${property}.set(providers.environmentVariable("${value.variable}").orElse(""))`;
};
