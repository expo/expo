// @ts-ignore
import chalk from 'chalk';

import { DevToolsPlugin } from '../../server/DevToolsPlugin';
import { createDevToolsMenuItems } from '../createDevToolsMenuItems';

const DEFAULT_SERVER_URL = 'http://localhost:19006';
const DEFAULT_PROJECT_ROOT = '/path/to/project';

describe('createInteractiveMenuItems', () => {
  it('should return empty list of menu items when no plugins are provided', () => {
    const menuItems = createDevToolsMenuItems([], DEFAULT_SERVER_URL, '', () => Promise.resolve());
    expect(menuItems.length).toEqual(0);
  });

  it('should return a single plugin item when a plugin with only a webapp is provided', () => {
    const plugin = new DevToolsPlugin(
      {
        packageName: 'test-plugin',
        packageRoot: 'path/to/test-plugin',
        webpageRoot: '/test/plugin',
      },
      DEFAULT_PROJECT_ROOT
    );

    const menuItems = createDevToolsMenuItems([plugin], DEFAULT_SERVER_URL, '', () =>
      Promise.resolve()
    );
    expect(menuItems.length).toBe(1);
    expect(menuItems[menuItems.length - 1].title).toBe(chalk`Open {bold test-plugin}`);
    expect(menuItems[menuItems.length - 1].children).toBeUndefined();
  });

  it('should create a main menu item with one child when plugin with one command is provided', () => {
    const plugin = new DevToolsPlugin(
      {
        packageName: 'test-plugin',
        packageRoot: 'path/to/test-plugin',
        cliExtensions: {
          description: 'Test CLI Extension',
          entryPoint: 'index.js',
          commands: [
            {
              name: 'test-command',
              title: 'Test Command',
              environments: ['cli'],
              parameters: [],
            },
          ],
        },
      },
      DEFAULT_PROJECT_ROOT
    );

    const menuItems = createDevToolsMenuItems([plugin], DEFAULT_SERVER_URL, '', () =>
      Promise.resolve()
    );
    expect(menuItems.length).toBe(1);
    expect(menuItems[menuItems.length - 1].title).toBe(chalk`{bold test-plugin}`);
    expect(menuItems[menuItems.length - 1].children?.length).toBe(1);
    expect(menuItems[menuItems.length - 1].children[0].title).toBe('Test Command');
  });

  it('should create a main menu item with two child when plugin with two commands is provided', () => {
    const plugin = new DevToolsPlugin(
      {
        packageName: 'test-plugin',
        packageRoot: 'path/to/test-plugin',
        cliExtensions: {
          description: 'Test CLI Extension',
          entryPoint: 'index.js',
          commands: [
            {
              name: 'test-command-1',
              title: 'Test Command 1',
              environments: ['cli'],
              parameters: [],
            },
            {
              name: 'test-command-2',
              title: 'Test Command 2',
              environments: ['cli'],
              parameters: [],
            },
          ],
        },
      },
      DEFAULT_PROJECT_ROOT
    );

    const menuItems = createDevToolsMenuItems([plugin], DEFAULT_SERVER_URL, '', () =>
      Promise.resolve()
    );
    expect(menuItems.length).toBe(1);
    expect(menuItems[menuItems.length - 1].title).toBe(chalk`{bold test-plugin}`);
    expect(menuItems[menuItems.length - 1].children?.length).toBe(2);
    expect(menuItems[menuItems.length - 1].children[0].title).toBe('Test Command 1');
    expect(menuItems[menuItems.length - 1].children[1].title).toBe('Test Command 2');
  });

  it('should create a main menu item with two children when plugin with webpage url and a command is provided', () => {
    const plugin = new DevToolsPlugin(
      {
        packageName: 'test-plugin',
        packageRoot: 'path/to/test-plugin',
        webpageRoot: '/test/plugin',
        cliExtensions: {
          description: 'Test CLI Extension',
          entryPoint: 'index.js',
          commands: [
            {
              name: 'test-command-1',
              title: 'Test Command 1',
              environments: ['cli'],
              parameters: [],
            },
          ],
        },
      },
      DEFAULT_PROJECT_ROOT
    );

    const menuItems = createDevToolsMenuItems([plugin], DEFAULT_SERVER_URL, '', () =>
      Promise.resolve()
    );
    expect(menuItems.length).toBe(1);
    expect(menuItems[menuItems.length - 1].title).toBe(chalk`{bold test-plugin}`);
    expect(menuItems[menuItems.length - 1].children?.length).toBe(2);
    expect(menuItems[menuItems.length - 1].children[0].title).toBe(chalk`Open {bold test-plugin}`);
    expect(menuItems[menuItems.length - 1].children[1].title).toBe('Test Command 1');
  });

  it('should return empty list if no commands supports the cli environment', () => {
    const plugin = new DevToolsPlugin(
      {
        packageName: 'test-plugin',
        packageRoot: 'path/to/test-plugin',
        cliExtensions: {
          description: 'Test plugin',
          commands: [
            { name: 'list', title: 'List registered background tasks', environments: ['mcp'] },
          ],
          entryPoint: 'cliext/build/index.js',
        },
      },
      DEFAULT_PROJECT_ROOT
    );

    const menuItems = createDevToolsMenuItems([plugin], DEFAULT_SERVER_URL, '', () =>
      Promise.resolve()
    );
    expect(menuItems.length).toBe(0);
  });
});
