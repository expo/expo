import { getMetroServerRoot } from '@expo/config/paths';
import path from 'path';
import resolveFrom from 'resolve-from';

import { createDomComponentsMiddleware } from '../DomComponentsMiddleware';
import type { ServerNext, ServerRequest, ServerResponse } from '../server.types';

jest.mock('resolve-from');

const asRequest = (req: Partial<ServerRequest>) => req as ServerRequest;

function createMockResponse() {
  return {
    getHeader: jest.fn(),
    setHeader: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    emit: jest.fn(),
    end: jest.fn(),
    statusCode: 200,
  } as unknown as ServerResponse;
}

describe('Check webview package installation', () => {
  const projectRoot = '/project';
  const metroRoot = getMetroServerRoot(projectRoot);

  const mockResolveFrom = resolveFrom as jest.MockedFunction<typeof resolveFrom>;
  mockResolveFrom.mockImplementation((fromDirectory: string, moduleId: string) => {
    if (moduleId === 'expo/dom/entry.js') {
      return path.join(fromDirectory, 'node_modules/expo/dom/entry.js');
    }
    throw new Error(`Cannot resolve module '${moduleId}' from '${fromDirectory}'`);
  });
  const mockResolveSilent = resolveFrom.silent as jest.MockedFunction<typeof resolveFrom.silent>;
  const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

  let req: ServerRequest;
  let res: ServerResponse;
  let next: jest.Mock<ServerNext>;
  let middleware: ReturnType<typeof createDomComponentsMiddleware>;

  beforeEach(() => {
    req = asRequest({
      url: 'http://localhost:8081/_expo/@dom/hello.tsx?file=file:///path/to/file.js',
      headers: { host: 'localhost:8081' },
    });
    res = createMockResponse();
    next = jest.fn();
    middleware = createDomComponentsMiddleware(
      { metroRoot, projectRoot },
      {
        mode: 'development',
        routerRoot: projectRoot,
        reactCompiler: false,
        isExporting: false,
      }
    );
  });

  afterEach(() => {
    mockResolveSilent.mockReset();
  });

  afterAll(() => {
    consoleWarnSpy.mockRestore();
  });

  it('should show an error message if the webview package is not installed', () => {
    mockResolveSilent.mockReturnValue(undefined);
    expect(() => middleware(req, res, next)).toThrow(
      /To use DOM Components, you must install the 'react-native-webview' package. Run 'npx expo install react-native-webview' to install it./
    );
  });

  it('should not show error messages if react-native-webview is installed', () => {
    mockResolveSilent.mockReturnValue('/project/node_modules/react-native-webview');
    expect(() => middleware(req, res, next)).not.toThrow();
  });

  it('should not show error messages if @expo/dom-webview is installed', () => {
    mockResolveSilent.mockReturnValue('/project/node_modules/@expo/dom-webview');
    expect(() => middleware(req, res, next)).not.toThrow();
  });
});
