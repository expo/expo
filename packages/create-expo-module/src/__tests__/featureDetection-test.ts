import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { detectFeaturesFromContent, findModuleDefinitionFile } from '../featureDetection';

describe('detectFeaturesFromContent', () => {
  it('detects Constant', () => {
    const { features } = detectFeaturesFromContent(`
      public func definition() -> ModuleDefinition {
        Constant("PI") {
      }
    `);
    expect(features).toContain('Constant');
    expect(features).not.toContain('Function');
  });

  it('detects Function without also detecting AsyncFunction', () => {
    const { features } = detectFeaturesFromContent(`
      Function("hello") { return "Hello world!" }
    `);
    expect(features).toContain('Function');
    expect(features).not.toContain('AsyncFunction');
  });

  it('detects AsyncFunction without also detecting Function', () => {
    const { features } = detectFeaturesFromContent(`
      AsyncFunction("setValueAsync") { (value: String) in }
    `);
    expect(features).toContain('AsyncFunction');
    expect(features).not.toContain('Function');
  });

  it('detects DSL calls when there is whitespace before the opening parenthesis', () => {
    const { features, sharedObjectName } = detectFeaturesFromContent(`
      Constant ("PI") { }
      AsyncFunction ("setValueAsync") { (value: String) in }
      Events ("onChange")
      Class (MyModuleModuleSharedObject.self) { }
    `);
    expect(features).toContain('Constant');
    expect(features).toContain('AsyncFunction');
    expect(features).toContain('Event');
    expect(features).toContain('SharedObject');
    expect(sharedObjectName).toBe('MyModuleModuleSharedObject');
  });

  it('detects Event at module level', () => {
    const { features } = detectFeaturesFromContent(`
      Events("onChange")
    `);
    expect(features).toContain('Event');
    expect(features).not.toContain('ViewEvent');
  });

  it('detects View without ViewEvent when no Events inside', () => {
    const { features } = detectFeaturesFromContent(`
      View(MyModuleView.self) {
      }
    `);
    expect(features).toContain('View');
    expect(features).not.toContain('ViewEvent');
    expect(features).not.toContain('Event');
  });

  it('detects ViewEvent from Events inside a View block', () => {
    const { features } = detectFeaturesFromContent(`
      View(MyModuleView.self) {
        Events("onTap")
      }
    `);
    expect(features).toContain('View');
    expect(features).toContain('ViewEvent');
    expect(features).not.toContain('Event');
  });

  it('detects Event at module level and ViewEvent inside View block simultaneously', () => {
    const { features } = detectFeaturesFromContent(`
      Events("onChange")
      View(MyModuleView.self) {
        Events("onTap")
      }
    `);
    expect(features).toContain('Event');
    expect(features).toContain('View');
    expect(features).toContain('ViewEvent');
  });

  it('detects SharedObject and extracts class name from Swift syntax', () => {
    const { features, sharedObjectName } = detectFeaturesFromContent(`
      Class(MyModuleModuleSharedObject.self) {
        Constructor { () -> MyModuleModuleSharedObject in
          return MyModuleModuleSharedObject()
        }
      }
    `);
    expect(features).toContain('SharedObject');
    expect(sharedObjectName).toBe('MyModuleModuleSharedObject');
  });

  it('detects SharedObject and extracts class name from Kotlin syntax', () => {
    const { features, sharedObjectName } = detectFeaturesFromContent(`
      Class(MyModuleModuleSharedObject::class) {
      }
    `);
    expect(features).toContain('SharedObject');
    expect(sharedObjectName).toBe('MyModuleModuleSharedObject');
  });

  it('ignores commented-out keywords', () => {
    const { features } = detectFeaturesFromContent(`
      // Function("commented") { }
      // Constants(["PI": 3.14])
      AsyncFunction("real") { (value: String) in }
    `);
    expect(features).not.toContain('Constant');
    expect(features).not.toContain('Function');
    expect(features).toContain('AsyncFunction');
  });

  it('returns empty results for empty content', () => {
    const { features, sharedObjectName } = detectFeaturesFromContent('');
    expect(features).toHaveLength(0);
    expect(sharedObjectName).toBeNull();
  });

  it('does not treat UIView( as a View feature', () => {
    const { features } = detectFeaturesFromContent(`
      let v = UIView(frame: .zero)
    `);
    expect(features).not.toContain('View');
  });

  it('detects ViewEvent when View opening brace is on same line as a prior closing brace', () => {
    const { features } = detectFeaturesFromContent(`
      } View(MyModuleView.self) {
        Events("onTap")
      }
    `);
    expect(features).toContain('View');
    expect(features).toContain('ViewEvent');
    expect(features).not.toContain('Event');
  });
});

describe('findModuleDefinitionFile', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'feat-detect-'));
  });

  afterEach(async () => {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  it('finds ModuleDefinition file in ios/ for apple platform', async () => {
    const iosDir = path.join(tmpDir, 'ios');
    await fs.promises.mkdir(iosDir);
    await fs.promises.writeFile(
      path.join(iosDir, 'MyModule.swift'),
      'public func definition() -> ModuleDefinition { Name("MyModule") }'
    );
    const result = await findModuleDefinitionFile(tmpDir, 'apple');
    expect(result).toBe(path.join(iosDir, 'MyModule.swift'));
  });

  it('finds ModuleDefinition file nested in android/src/ for android platform', async () => {
    const srcDir = path.join(tmpDir, 'android', 'src', 'main', 'java', 'expo', 'modules', 'mymod');
    await fs.promises.mkdir(srcDir, { recursive: true });
    await fs.promises.writeFile(
      path.join(srcDir, 'MyModModule.kt'),
      'override fun definition() = ModuleDefinition { Name("MyMod") }'
    );
    const result = await findModuleDefinitionFile(tmpDir, 'android');
    expect(result).toBe(path.join(srcDir, 'MyModModule.kt'));
  });

  it('returns null when no file contains ModuleDefinition', async () => {
    await fs.promises.mkdir(path.join(tmpDir, 'ios'));
    await fs.promises.writeFile(path.join(tmpDir, 'ios', 'Other.swift'), 'class Other {}');
    const result = await findModuleDefinitionFile(tmpDir, 'apple');
    expect(result).toBeNull();
  });

  it('returns null when platform directory does not exist', async () => {
    const result = await findModuleDefinitionFile(tmpDir, 'apple');
    expect(result).toBeNull();
  });

  it('skips generated directories when searching for module definitions', async () => {
    const iosDir = path.join(tmpDir, 'ios');
    await fs.promises.mkdir(path.join(iosDir, 'build'), { recursive: true });
    await fs.promises.writeFile(
      path.join(iosDir, 'build', 'StaleModule.swift'),
      'public func definition() -> ModuleDefinition { Name("StaleModule") }'
    );

    const result = await findModuleDefinitionFile(tmpDir, 'apple');
    expect(result).toBeNull();
  });
});
