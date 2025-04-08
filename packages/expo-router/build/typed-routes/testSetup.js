"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("fs/promises");
const path_1 = require("path");
const generate_1 = require("./generate");
const context_stubs_1 = require("../testing-library/context-stubs");
const fixtures = {
    default: {
        context: {
            '/apple': () => null,
            '/banana': () => null,
            '/colors/[color]': () => null,
            '/animals/[...animal]': () => null,
            '/mix/[fruit]/[color]/[...animals]': () => null,
            '/(group)/static': () => null,
            '/(group)/(a,b)/folder/index': () => null,
            '/(group)/(a,b)/folder/[slug]': () => null,
            '/(group)/(a,b)/folder/[...slug]': () => null,
            '/(c)/folder/[slug]': () => null,
            '/(group)/index': () => null,
        },
    },
    partialGroups: {
        options: { partialTypedGroups: true },
        context: {
            '/(group)/static': () => null,
            '/(group)/(a,b)/folder/index': () => null,
            '/(group)/(a,b)/folder/[slug]': () => null,
            '/(group)/(a,b)/folder/[...slug]': () => null,
        },
    },
};
module.exports = function () {
    return Promise.all(Object.entries(fixtures).map(async ([key, value]) => {
        const template = (0, generate_1.getTypedRoutesDeclarationFile)((0, context_stubs_1.inMemoryContext)(value.context), {
            ...value.options,
            testIgnoreComments: true,
        });
        return (0, promises_1.writeFile)((0, path_1.join)(__dirname, '/__tests__/fixtures/', key + '.d.ts'), template);
    }));
};
//# sourceMappingURL=testSetup.js.map