type GradleFieldKind = 'groovyIdentifier' | 'gradleProjectName' | 'javaPackage' | 'mavenVersion' | 'envVarName';
export declare const validateGradleField: (kind: GradleFieldKind, value: unknown, fieldName: string) => string;
export declare const escapeGroovyDoubleQuotedString: (value: string) => string;
export {};
