import { vol } from 'memfs';

import {
  findDependencies,
  findLocalDependencies,
  findLocalDependenciesFromFileAsync,
  findLocalDependenciesFromFileRecursiveAsync,
  getAbsoluteModulePath,
} from '../findDependencies';

jest.mock('fs/promises');

describe(findDependencies, () => {
  it('should return an empty array when given an empty string', () => {
    const result = findDependencies('/app', '');
    expect(result).toEqual([]);
  });

  it('should return an empty array when given a string with no dependencies', () => {
    const result = findDependencies('/app', 'const x = 1;');
    expect(result).toEqual([]);
  });

  it('should return an array of dependencies when given a string with dependencies', () => {
    const result = findDependencies(
      '/app',
      `
import { foo } from "foo";
import bar from 'bar';
import localModule from "./localModule";
import parentModule from '../../parentModule';
import rootModule from '/root/rootModule';
const { foo2 } = require("foo2");
const bar2 = require('bar2');
const localModule2 = require("./localModule2");
const parentModule2 = require('../../parentModule2');
const rootModule2 = require('/root/rootModule2');
`
    );
    expect(result).toEqual([
      'foo',
      'bar',
      './localModule',
      '../../parentModule',
      '/root/rootModule',
      'foo2',
      'bar2',
      './localModule2',
      '../../parentModule2',
      '/root/rootModule2',
    ]);
  });

  it('should return an array of unique dependencies when given a string with duplicate dependencies', () => {
    const result = findDependencies(
      '/app',
      `
import { foo } from "foo";
import bar from 'bar';
import localModule from "./localModule";
import parentModule from '../../parentModule';
import rootModule from '/root/rootModule';
const { foo2 } = require("foo2");
const bar2 = require('bar2');
const localModule2 = require("./localModule2");
const parentModule2 = require('../../parentModule2');
const rootModule2 = require('/root/rootModule2');

import { foo3 } from "foo";
import bar3 from 'bar';
import localModule3 from "./localModule";
import parentModule3 from '../../parentModule';
import rootModule3 from '/root/rootModule';
const { foo4 } = require("foo2");
const bar4 = require('bar2');
const localModule4 = require("./localModule2");
const parentModule4 = require('../../parentModule2');
const rootModule4 = require('/root/rootModule2');
`
    );
    expect(result).toEqual([
      'foo',
      'bar',
      './localModule',
      '../../parentModule',
      '/root/rootModule',
      'foo2',
      'bar2',
      './localModule2',
      '../../parentModule2',
      '/root/rootModule2',
    ]);
  });

  it('should limited support template literals for `require`', () => {
    expect(findDependencies('/app', 'const foo = require(`foo`);')).toEqual(['foo']);
    expect(findDependencies('/app', 'const foo = require(`foo${"hello"}`);')).toEqual([]);
    expect(findDependencies('/app', 'const foo = require(`${"hello"}`);')).toEqual([]);
  });

  it('should return an empty array when given an error source code', () => {
    const result = findDependencies(
      '/app',
      `
import foo from 'foo';
// SyntaxError: Identifier 'foo' has already been declared
import foo from 'foo';
`
    );
    expect(result).toEqual([]);
  });

  it('should return an empty array when given an unsupport imports', () => {
    const result = findDependencies(
      '/app',
      `
const foo = import('foo');
const bar = require.resolve('bar');
const qux = require.context('qux');
`
    );
    expect(result).toEqual([]);
  });
});

describe(findLocalDependencies, () => {
  it('should return only local dependencies', () => {
    const result = findLocalDependencies(
      '/app',
      `
import { foo } from "foo";
import bar from 'bar';
import localModule from "./localModule";
const parentModule = require('../../parentModule');
import rootModule from '/root/rootModule';
`
    );
    expect(result).toEqual(['./localModule', '../../parentModule', '/root/rootModule']);
  });

  it('should return an empty array when no matched dependencies', () => {
    expect(findLocalDependencies('/app', 'import bar from "bar"')).toEqual([]);
  });
});

describe(findLocalDependenciesFromFileAsync, () => {
  afterEach(() => {
    vol.reset();
  });

  it('should return an array of local dependencies from given file', async () => {
    vol.fromJSON({
      '/app/withNoOpPlugin.js': `
import { foo } from "foo";
import bar from 'bar';
import localModule from "./localModule";
const parentModule = require('../parentModule');
import rootModule from '/root/rootModule';
const fs = require('fs');

const withNoOpPlugin = (config) => {
  return config;
};
module.exports = withNoOpPlugin;
`,
    });

    expect(await findLocalDependenciesFromFileAsync('/app', './withNoOpPlugin')).toEqual([
      'localModule.js',
      '../parentModule.js',
      '../root/rootModule.js',
    ]);
  });

  it('should throw error when given file does not exist', async () => {
    expect(findLocalDependenciesFromFileAsync('/app', './nonExistentFile')).rejects.toThrow();
  });
});

describe(findLocalDependenciesFromFileRecursiveAsync, () => {
  beforeAll(() => {
    // The dependency graph:
    //     /app/withMyPlugin
    //         -> /app/plugins/withMyInfoPlistPlugin
    //             -> /app/plugins/withDebugConfigPlugin
    //         -> /app/withNoOpPlugin
    vol.fromJSON({
      '/app/plugins/withMyInfoPlistPlugin.js': `
const path = require('path');
const { withInfoPlist } = require('expo/config-plugins');
const withDebugConfigPlugin = require('./withDebugConfigPlugin');

const withMyInfoPlistPlugin = (config) => {
  config = withDebugConfigPlugin(config);
  config = withInfoPlist(config, (config) => {
    config.modResults.NSLocationWhenInUseUsageDescription = 'Allow $(PRODUCT_NAME) to use your location';
    return config;
  });
  return config;
};
module.exports = withMyInfoPlistPlugin;
`,
      '/app/plugins/withDebugConfigPlugin.js': `
const debug = require('debug')('FOO');

const withDebugConfigPlugin = (config) => {
  debug(config);
  return config;
};
module.exports = withDebugConfigPlugin;
`,
      '/app/withNoOpPlugin.js': `
const fs = require('fs');

const withNoOpPlugin = (config) => {
  return config;
};
module.exports = withNoOpPlugin;
`,
      '/app/withMyPlugin.js': `
const path = require('path');
const withMyInfoPlistPlugin = require('./plugins/withMyInfoPlistPlugin');
const withNoOpPlugin = require('./withNoOpPlugin');

const withMyPlugin = (config) => {
  config = withMyInfoPlistPlugin(config);
  config = withNoOpPlugin(config);
  return config;
};
module.exports = withMyInfoPlistPlugin;
`,
    });
  });

  afterAll(() => {
    vol.reset();
  });

  it('should return an array of local dependencies from given file', async () => {
    const expectedResult = [
      'plugins/withMyInfoPlistPlugin.js',
      'plugins/withDebugConfigPlugin.js',
      'withNoOpPlugin.js',
    ];

    expect(await findLocalDependenciesFromFileRecursiveAsync('/app', '/app/withMyPlugin')).toEqual(
      expectedResult
    );
    expect(await findLocalDependenciesFromFileRecursiveAsync('/app', './withMyPlugin')).toEqual(
      expectedResult
    );
    expect(await findLocalDependenciesFromFileRecursiveAsync('/app', './withMyPlugin.js')).toEqual(
      expectedResult
    );
  });

  it('should throw error when given file does not exist', async () => {
    expect(
      findLocalDependenciesFromFileRecursiveAsync('/app', './nonExistentFile')
    ).rejects.toThrow();
  });
});

describe(getAbsoluteModulePath, () => {
  it('should append `.js` extension if missing', () => {
    expect(getAbsoluteModulePath('/app', 'withPlugin')).toEqual('/app/withPlugin.js');
    expect(getAbsoluteModulePath('/app', './withPlugin')).toEqual('/app/withPlugin.js');
    expect(getAbsoluteModulePath('/app', './withPlugin.js')).toEqual('/app/withPlugin.js');
  });

  it('should not append extname if specified ', () => {
    expect(getAbsoluteModulePath('/app', 'file.jpg')).toEqual('/app/file.jpg');
    expect(getAbsoluteModulePath('/app', './file.ts')).toEqual('/app/file.ts');
    expect(getAbsoluteModulePath('/app', './file.js.ts')).toEqual('/app/file.js.ts');
  });

  it('should return the absolute file path for a given module', () => {
    expect(getAbsoluteModulePath('/app', 'withPlugin')).toEqual('/app/withPlugin.js');
    expect(getAbsoluteModulePath('/app', './withPlugin')).toEqual('/app/withPlugin.js');
    expect(getAbsoluteModulePath('/app/plugins', './withPlugin')).toEqual(
      '/app/plugins/withPlugin.js'
    );
    expect(getAbsoluteModulePath('/app/plugins', '../withPlugin')).toEqual('/app/withPlugin.js');
    expect(getAbsoluteModulePath('/app/plugins', '/app/withPlugin')).toEqual('/app/withPlugin.js');
    expect(getAbsoluteModulePath('/app/plugins', '/withPlugin')).toEqual('/withPlugin.js');
  });
});
