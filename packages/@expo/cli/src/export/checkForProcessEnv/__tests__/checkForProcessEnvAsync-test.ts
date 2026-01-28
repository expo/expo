describe('process.env pattern matching', () => {
  // The pattern used in checkForProcessEnvAsync to match process.env.VARIABLE_NAME
  const processEnvPattern = /process\.env\.([A-Z_][A-Z0-9_]*)/gi;

  const findEnvVars = (source: string): string[] => {
    const found: string[] = [];
    let match;
    // Reset lastIndex for global regex
    processEnvPattern.lastIndex = 0;
    while ((match = processEnvPattern.exec(source)) !== null) {
      found.push(match[1]);
    }
    return found;
  };

  it(`matches simple process.env references`, () => {
    const source = `const x = process.env.NODE_ENV;`;
    expect(findEnvVars(source)).toEqual(['NODE_ENV']);
  });

  it(`matches multiple process.env references`, () => {
    const source = `
      const env = process.env.NODE_ENV;
      const key = process.env.API_KEY;
      const secret = process.env.SECRET_TOKEN;
    `;
    expect(findEnvVars(source)).toEqual(['NODE_ENV', 'API_KEY', 'SECRET_TOKEN']);
  });

  it(`matches EXPO_PUBLIC prefixed variables`, () => {
    const source = `const url = process.env.EXPO_PUBLIC_API_URL;`;
    expect(findEnvVars(source)).toEqual(['EXPO_PUBLIC_API_URL']);
  });

  it(`matches variables with underscores and numbers`, () => {
    const source = `
      const a = process.env.MY_VAR_123;
      const b = process.env._PRIVATE_VAR;
      const c = process.env.VAR2;
    `;
    expect(findEnvVars(source)).toEqual(['MY_VAR_123', '_PRIVATE_VAR', 'VAR2']);
  });

  it(`matches lowercase variable names due to case-insensitive flag`, () => {
    // The pattern has the 'i' flag, so it matches lowercase variable names too
    const source = `const x = process.env.lowercase;`;
    expect(findEnvVars(source)).toEqual(['lowercase']);
  });

  it(`does not match empty process.env access`, () => {
    const source = `const x = process.env;`;
    expect(findEnvVars(source)).toEqual([]);
  });

  it(`does not match bracket notation access`, () => {
    // Bracket notation like process.env["VAR"] is not matched by the pattern
    const source = `const x = process.env["NODE_ENV"];`;
    expect(findEnvVars(source)).toEqual([]);
  });

  it(`matches in minified code`, () => {
    const source = `var a=process.env.NODE_ENV,b=process.env.API_KEY;`;
    expect(findEnvVars(source)).toEqual(['NODE_ENV', 'API_KEY']);
  });

  it(`returns empty array when no matches`, () => {
    const source = `const x = "hello world";`;
    expect(findEnvVars(source)).toEqual([]);
  });

  it(`handles case insensitivity in process.env but preserves variable name case`, () => {
    // The 'i' flag makes process.env case insensitive, but we capture the actual variable name
    const source = `const x = PROCESS.ENV.MY_VAR;`;
    expect(findEnvVars(source)).toEqual(['MY_VAR']);
  });
});

describe('unresolved environment variable detection', () => {
  const checkUnresolved = (
    envVars: string[],
    currentEnv: Record<string, string | undefined>
  ): string[] => {
    return envVars.filter((envVar) => currentEnv[envVar] === undefined);
  };

  it(`identifies unresolved variables`, () => {
    const found = ['NODE_ENV', 'API_KEY', 'SECRET'];
    const env = { NODE_ENV: 'production' };
    expect(checkUnresolved(found, env)).toEqual(['API_KEY', 'SECRET']);
  });

  it(`returns empty when all variables are resolved`, () => {
    const found = ['NODE_ENV', 'API_KEY'];
    const env = { NODE_ENV: 'production', API_KEY: 'key123' };
    expect(checkUnresolved(found, env)).toEqual([]);
  });

  it(`returns all when no variables are resolved`, () => {
    const found = ['API_KEY', 'SECRET'];
    const env = {};
    expect(checkUnresolved(found, env)).toEqual(['API_KEY', 'SECRET']);
  });

  it(`handles empty string as resolved`, () => {
    const found = ['EMPTY_VAR'];
    const env = { EMPTY_VAR: '' };
    expect(checkUnresolved(found, env)).toEqual([]);
  });
});
