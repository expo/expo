"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeGroovyDoubleQuotedString = exports.validateGradleField = void 0;
// No hyphens — would parse as subtraction in Groovy block syntax like `myRepo { ... }`.
const GROOVY_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
// Rejects dots and slashes so the value is also safe as a directory segment.
const GRADLE_PROJECT_NAME = /^[A-Za-z_][A-Za-z0-9_-]*$/;
const JAVA_PACKAGE = /^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*$/;
const MAVEN_VERSION = /^[A-Za-z0-9._+-]+$/;
const ENV_VAR_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
const PATTERNS = {
    groovyIdentifier: {
        pattern: GROOVY_IDENTIFIER,
        shape: 'a Groovy identifier (letters, digits, and underscores, starting with a letter or underscore)',
    },
    gradleProjectName: {
        pattern: GRADLE_PROJECT_NAME,
        shape: 'a Gradle project name (letters, digits, underscores, and hyphens, starting with a letter or underscore)',
    },
    javaPackage: {
        pattern: JAVA_PACKAGE,
        shape: 'a dot-separated Java package (e.g. com.example.app)',
    },
    mavenVersion: {
        pattern: MAVEN_VERSION,
        shape: 'a Maven-compatible version (letters, digits, dots, hyphens, underscores, or plus signs)',
    },
    envVarName: {
        pattern: ENV_VAR_NAME,
        shape: 'an environment variable name (letters, digits, and underscores, starting with a letter or underscore)',
    },
};
const validateGradleField = (kind, value, fieldName) => {
    const { pattern, shape } = PATTERNS[kind];
    if (typeof value !== 'string' || !pattern.test(value)) {
        throw new Error(`Invalid ${fieldName} ${JSON.stringify(value)}: must be ${shape}. Update your app config and re-run prebuild.`);
    }
    return value;
};
exports.validateGradleField = validateGradleField;
// Groovy double-quoted strings share JSON's escape grammar, except `$` (GString interpolation).
const escapeGroovyDoubleQuotedString = (value) => {
    return JSON.stringify(value).slice(1, -1).replace(/\$/g, '\\$');
};
exports.escapeGroovyDoubleQuotedString = escapeGroovyDoubleQuotedString;
