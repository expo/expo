import { vol } from 'memfs';

import { ConfigError } from '../Errors';
import { NON_STANDARD_SYMBOL } from '../environment';
import { evalConfig, resolveConfigExport } from '../evalConfig';

jest.mock('fs');
jest.mock('../Serialize', () => ({
  serializeSkippingMods: jest.fn(),
}));

describe('evalConfig', () => {
  beforeEach(() => {
    vol.reset();
    jest.clearAllMocks();
    // Default behavior: serializeSkippingMods returns the input
    mockSerializeSkippingMods.mockImplementation((input) => input);
  });

  const mockSerializeSkippingMods = require('../Serialize')
    .serializeSkippingMods as jest.MockedFunction<any>;

  describe('evalConfig function', () => {
    it('should successfully transpile and evaluate a simple config object', () => {
      const configPath = '/app.config.js';
      const configContent = 'module.exports = { name: "test", slug: "test-app" };';

      vol.fromJSON({ [configPath]: configContent });

      const result = evalConfig(configPath, null);

      expect(result.config).toEqual({ name: 'test', slug: 'test-app' });
      expect(result.exportedObjectType).toBe('object');
    });

    it('should handle TypeScript config files', () => {
      const configPath = '/app.config.ts';
      const configContent = 'export default { name: "test", slug: "test-app" };';

      vol.fromJSON({ [configPath]: configContent });

      const result = evalConfig(configPath, null);

      expect(result.config).toEqual({ name: 'test', slug: 'test-app' });
      expect(result.exportedObjectType).toBe('object');
    });

    it('should handle function exports with context', () => {
      const configPath = '/app.config.js';
      const configContent = 'module.exports = ({ config }) => ({ ...config, name: "dynamic" });';
      const context = { config: { slug: 'test' } } as any;

      vol.fromJSON({ [configPath]: configContent });

      const result = evalConfig(configPath, context);

      // The NON_STANDARD_SYMBOL gets added during real execution
      const expectedConfig = { name: 'dynamic', slug: 'test' };
      expectedConfig[NON_STANDARD_SYMBOL] = true;
      expect(result.config).toEqual(expectedConfig);
      expect(result.exportedObjectType).toBe('function');
    });

    it('should handle complex TypeScript app.config.ts with imports and environment variables', () => {
      const configPath = '/app.config.ts';
      const configContent = `
        const base = {
          platforms: ['ios', 'android'],
          version: '1.0.0'
        };

        const mapBuildProfileToConfig = {
          'development': {
            ...base,
            slug: 'my-app-dev',
            name: 'My App (Dev)',
            extra: {
              environment: 'development',
              apiUrl: 'https://dev-api.example.com'
            },
          },
          'production': {
            ...base,
            slug: 'my-app',
            name: 'My App',
            extra: {
              environment: 'production',
              apiUrl: 'https://api.example.com'
            },
          },
        };

        const buildType = 'development'; // Fixed value for testing
        const config = mapBuildProfileToConfig[buildType];
        export default config;
      `;

      vol.fromJSON({ [configPath]: configContent });

      const result = evalConfig(configPath, null);

      expect(result.config).toEqual({
        platforms: ['ios', 'android'],
        version: '1.0.0',
        slug: 'my-app-dev',
        name: 'My App (Dev)',
        extra: {
          environment: 'development',
          apiUrl: 'https://dev-api.example.com',
        },
      });
      expect(result.exportedObjectType).toBe('object');
    });

    it('should handle TypeScript app.config.ts with type annotations and interfaces', () => {
      const configPath = '/app.config.ts';
      const configContent = `
        interface CustomConfig {
          name: string;
          slug: string;
          features?: {
            analytics: boolean;
            notifications: boolean;
          };
        }

        const config: CustomConfig = {
          name: 'TypeScript App',
          slug: 'typescript-app',
          features: {
            analytics: true,
            notifications: false
          }
        };

        export default config;
      `;

      vol.fromJSON({ [configPath]: configContent });

      const result = evalConfig(configPath, null);

      expect(result.config).toEqual({
        name: 'TypeScript App',
        slug: 'typescript-app',
        features: {
          analytics: true,
          notifications: false,
        },
      });
    });

    it('should handle syntax errors from esbuild', () => {
      const configPath = '/app.config.js';
      const configContent = 'module.exports = { invalid syntax';

      vol.fromJSON({ [configPath]: configContent });

      expect(() => evalConfig(configPath, null)).toThrow(/Expected "}" but found "syntax"/);
    });

    it('should handle non-syntax errors', () => {
      const configPath = '/app.config.js';
      const configContent = 'throw new Error("Runtime error")';

      vol.fromJSON({ [configPath]: configContent });

      expect(() => evalConfig(configPath, null)).toThrow('Runtime error');
    });
  });

  describe('resolveConfigExport function', () => {
    it('should handle default exports', () => {
      const result = { default: { name: 'test', slug: 'test-app' } };
      const configFile = '/app.config.js';

      const resolved = resolveConfigExport(result, configFile, null);

      expect(resolved.config).toEqual({ name: 'test', slug: 'test-app' });
      expect(resolved.exportedObjectType).toBe('object');
    });

    it('should handle function exports', () => {
      const mockFunction = jest.fn().mockReturnValue({ name: 'test', slug: 'test-app' });
      const context = { config: { version: '1.0.0' } } as any;
      const configFile = '/app.config.js';

      const resolved = resolveConfigExport(mockFunction, configFile, context);

      expect(mockFunction).toHaveBeenCalledWith(context);
      expect(resolved.config).toEqual({ name: 'test', slug: 'test-app' });
      expect(resolved.exportedObjectType).toBe('function');
    });

    it('should throw error for Promise exports', () => {
      const promiseResult = Promise.resolve({ name: 'test' });
      const configFile = '/app.config.js';

      expect(() => resolveConfigExport(promiseResult, configFile, null)).toThrow(ConfigError);
      expect(() => resolveConfigExport(promiseResult, configFile, null)).toThrow(
        'Config file /app.config.js cannot return a Promise.'
      );
    });

    it('should extract expo object from config', () => {
      const result = {
        expo: { name: 'test', slug: 'test-app' },
        otherField: 'ignored',
      };
      const configFile = '/app.config.js';

      // Mock serializeSkippingMods to return the input
      jest.doMock('../Serialize', () => ({
        serializeSkippingMods: jest.fn((input) => input),
      }));

      const resolved = resolveConfigExport(result, configFile, null);

      expect(resolved.config).toEqual({ name: 'test', slug: 'test-app' });
    });

    it('should track static config usage', () => {
      const mockFunctionResult = { name: 'test' };
      mockFunctionResult[NON_STANDARD_SYMBOL] = true;
      const mockFunction = jest.fn().mockReturnValue(mockFunctionResult);
      const context = { config: { version: '1.0.0' } } as any;
      const configFile = '/app.config.js';

      const resolved = resolveConfigExport(mockFunction, configFile, context);

      expect(resolved.mayHaveUnusedStaticConfig).toBe(false);
    });

    it('should detect potentially unused static config', () => {
      const mockFunction = jest.fn().mockReturnValue({ name: 'test' });
      const context = { config: { version: '1.0.0' } } as any;
      // The resolveConfigExport function will add NON_STANDARD_SYMBOL to context.config
      const configFile = '/app.config.js';

      const resolved = resolveConfigExport(mockFunction, configFile, context);

      expect(resolved.mayHaveUnusedStaticConfig).toBe(true);
    });

    it('should handle null context', () => {
      const result = { name: 'test', slug: 'test-app' };
      const configFile = '/app.config.js';

      const resolved = resolveConfigExport(result, configFile, null);

      expect(resolved.config).toEqual({ name: 'test', slug: 'test-app' });
      // When context is null, mayHaveUnusedStaticConfig should be undefined (undefined && anything = undefined)
      expect(resolved.mayHaveUnusedStaticConfig).toBe(undefined);
    });

    it('should clean up _hasBaseStaticConfig from result', () => {
      const result = { name: 'test', _hasBaseStaticConfig: true };
      const configFile = '/app.config.js';

      const resolved = resolveConfigExport(result, configFile, null);

      expect(resolved.config).not.toHaveProperty('_hasBaseStaticConfig');
    });
  });
});
