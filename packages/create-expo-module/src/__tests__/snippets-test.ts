import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  buildAppSnippets,
  buildModuleSnippets,
  buildViewSnippets,
  buildWebModuleSnippets,
  copyFileSnippets,
} from '../snippets';

// Minimal mock data matching SubstitutionData shape
const mockData = {
  project: {
    slug: 'my-module',
    name: 'MyModule',
    version: '0.1.0',
    description: 'Test',
    package: 'expo.modules.mymodule',
    moduleName: 'MyModuleModule',
    viewName: 'MyModuleView',
    sharedObjectName: 'MyModuleModuleSharedObject',
    platforms: ['apple', 'android'],
    features: ['Function'],
  },
  author: 'Test',
  license: 'MIT',
  repo: 'https://github.com/test/test',
  type: 'remote' as const,
};

// Path to the actual snippets directory in the template package
const SNIPPETS_DIR = path.resolve(__dirname, '../../../../packages/expo-module-template/snippets');

describe('buildModuleSnippets', () => {
  it('returns empty string when no features are selected', async () => {
    const result = await buildModuleSnippets(SNIPPETS_DIR, [], mockData, 'swift');
    expect(result.trim()).toBe('');
  });

  it('includes Function snippet for swift when Function feature selected', async () => {
    const result = await buildModuleSnippets(SNIPPETS_DIR, ['Function'], mockData, 'swift');
    expect(result).toContain('Function("hello")');
  });

  it('includes Function snippet for kt when Function feature selected', async () => {
    const result = await buildModuleSnippets(SNIPPETS_DIR, ['Function'], mockData, 'kt');
    expect(result).toContain('Function("hello")');
  });

  it('includes Constant snippet', async () => {
    const result = await buildModuleSnippets(SNIPPETS_DIR, ['Constant'], mockData, 'swift');
    expect(result).toContain('Constant("PI")');
  });

  it('joins multiple snippets', async () => {
    const result = await buildModuleSnippets(
      SNIPPETS_DIR,
      ['Function', 'AsyncFunction'],
      mockData,
      'swift'
    );
    expect(result).toContain('Function("hello")');
    expect(result).toContain('AsyncFunction("setValueAsync")');
  });

  it('includes SharedObject class definition for swift when SharedObject feature selected', async () => {
    const result = await buildModuleSnippets(SNIPPETS_DIR, ['SharedObject'], mockData, 'swift');
    expect(result).toContain('Class(MyModuleModuleSharedObject.self)');
  });
});

describe('buildViewSnippets', () => {
  it('returns empty string when ViewEvent not selected', async () => {
    const result = await buildViewSnippets(SNIPPETS_DIR, ['View'], mockData, 'swift');
    expect(result.trim()).toBe('');
  });

  it('includes ViewEvent block when ViewEvent selected', async () => {
    const result = await buildViewSnippets(SNIPPETS_DIR, ['View', 'ViewEvent'], mockData, 'swift');
    expect(result).toContain('Events("onLoad")');
  });
});

describe('buildWebModuleSnippets', () => {
  it('returns empty string when no features selected', async () => {
    const result = await buildWebModuleSnippets(SNIPPETS_DIR, [], mockData);
    expect(result).toBe('');
  });

  it('includes PI constant for Constant feature', async () => {
    const result = await buildWebModuleSnippets(SNIPPETS_DIR, ['Constant'], mockData);
    expect(result).toContain('PI = Math.PI');
  });

  it('includes hello method for Function feature', async () => {
    const result = await buildWebModuleSnippets(SNIPPETS_DIR, ['Function'], mockData);
    expect(result).toContain('hello()');
    expect(result).toContain('Hello world!');
  });

  it('includes emit call in AsyncFunction when Event is also selected', async () => {
    const dataWithEvent = {
      ...mockData,
      project: { ...mockData.project, features: ['AsyncFunction', 'Event'] },
    };
    const result = await buildWebModuleSnippets(
      SNIPPETS_DIR,
      ['AsyncFunction', 'Event'],
      dataWithEvent
    );
    expect(result).toContain("this.emit('onChange'");
  });

  it('generates empty body AsyncFunction when Event is not selected', async () => {
    const dataNoEvent = {
      ...mockData,
      project: { ...mockData.project, features: ['AsyncFunction'] },
    };
    const result = await buildWebModuleSnippets(SNIPPETS_DIR, ['AsyncFunction'], dataNoEvent);
    expect(result).toContain('setValueAsync');
    expect(result).not.toContain('this.emit');
  });
});

describe('buildAppSnippets', () => {
  it('returns empty string when no features selected', async () => {
    const result = await buildAppSnippets(SNIPPETS_DIR, [], mockData, 'jsx');
    expect(result).toBe('');
  });

  it('includes Constants Group for Constant feature (jsx)', async () => {
    const result = await buildAppSnippets(SNIPPETS_DIR, ['Constant'], mockData, 'jsx');
    expect(result).toContain('Group name="Constants"');
    expect(result).toContain('MyModule.PI');
  });

  it('includes useEvent import for Event feature (imports)', async () => {
    const result = await buildAppSnippets(SNIPPETS_DIR, ['Event'], mockData, 'imports');
    expect(result).toContain("import { useEvent } from 'expo'");
  });

  it('includes useEvent hook for Event feature (hooks)', async () => {
    const result = await buildAppSnippets(SNIPPETS_DIR, ['Event'], mockData, 'hooks');
    expect(result).toContain('useEvent(MyModule');
  });

  it('includes View named import for View feature (imports)', async () => {
    const result = await buildAppSnippets(SNIPPETS_DIR, ['View'], mockData, 'imports');
    expect(result).toContain('MyModuleView');
  });

  it('includes onLoad prop in View jsx when ViewEvent is also selected', async () => {
    const dataWithViewEvent = {
      ...mockData,
      project: { ...mockData.project, features: ['View', 'ViewEvent'] },
    };
    const result = await buildAppSnippets(
      SNIPPETS_DIR,
      ['View', 'ViewEvent'],
      dataWithViewEvent,
      'jsx'
    );
    expect(result).toContain('onLoad');
  });

  it('does NOT include onLoad prop when only View is selected', async () => {
    const dataViewOnly = {
      ...mockData,
      project: { ...mockData.project, features: ['View'] },
    };
    const result = await buildAppSnippets(SNIPPETS_DIR, ['View'], dataViewOnly, 'jsx');
    expect(result).not.toContain('onLoad');
  });

  it('includes SharedObject hook import and jsx', async () => {
    const result = await buildAppSnippets(SNIPPETS_DIR, ['SharedObject'], mockData, 'imports');
    expect(result).toContain('useMyModuleModuleSharedObject');
  });
});

describe('copyFileSnippets', () => {
  it('copies view tsx files when View feature selected', async () => {
    const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'snippets-test-'));
    try {
      await copyFileSnippets(SNIPPETS_DIR, ['View'], mockData, tmpDir);
      const viewTsx = path.join(tmpDir, 'src', `${mockData.project.viewName}.tsx`);
      const exists = await fs.promises
        .access(viewTsx)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    } finally {
      await fs.promises.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('does not copy view swift file when apple platform not selected', async () => {
    const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'snippets-test-'));
    const dataWithoutApple = {
      ...mockData,
      project: { ...mockData.project, platforms: ['android'] },
    };
    try {
      await copyFileSnippets(SNIPPETS_DIR, ['View'], dataWithoutApple, tmpDir);
      const viewSwift = path.join(tmpDir, 'ios', `${mockData.project.viewName}.swift`);
      const exists = await fs.promises
        .access(viewSwift)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(false);
    } finally {
      await fs.promises.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('does not copy any files when feature not selected', async () => {
    const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'snippets-test-'));
    try {
      await copyFileSnippets(SNIPPETS_DIR, [], mockData, tmpDir);
      const entries = await fs.promises.readdir(tmpDir);
      expect(entries).toHaveLength(0);
    } finally {
      await fs.promises.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
