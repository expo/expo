import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  detectExpoModuleFromContent,
  detectFeaturesFromContent,
  detectV2FeaturesFromContent,
  findExpoModuleFile,
  findModuleDefinitionFile,
} from '../featureDetection';

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

  it('detects SwiftUIView from Swift ExpoUIView registration', () => {
    const { features } = detectFeaturesFromContent(`
      ExpoUIView(MyModuleSwiftUIView.self)
    `);
    expect(features).toContain('SwiftUIView');
    expect(features).not.toContain('ComposeView');
    expect(features).not.toContain('View');
  });

  it('detects ComposeView from Kotlin ExpoUIView<Props>("Name") registration', () => {
    const { features } = detectFeaturesFromContent(`
      ExpoUIView<MyModuleComposeProps>("MyModuleComposeView") {
        Content { props -> MyModuleComposeContent(props) }
      }
    `);
    expect(features).toContain('ComposeView');
    expect(features).not.toContain('SwiftUIView');
  });

  it('detects SwiftUIModifier from ViewModifierRegistry.register', () => {
    const { features } = detectFeaturesFromContent(`
      OnCreate {
        ViewModifierRegistry.register("customBorder") { params, appContext, _ in
          return try CustomBorderModifier(from: params, appContext: appContext)
        }
      }
    `);
    expect(features).toContain('SwiftUIModifier');
    expect(features).not.toContain('ComposeModifier');
  });

  it('detects ComposeModifier from ModifierRegistry.register', () => {
    const { features } = detectFeaturesFromContent(`
      OnCreate {
        ModifierRegistry.register("customBorder") { params, _, _, _ ->
          recordFromMap<Params>(params).toModifier()
        }
      }
    `);
    expect(features).toContain('ComposeModifier');
    expect(features).not.toContain('SwiftUIModifier');
  });

  it('does not double-detect ModifierRegistry inside ViewModifierRegistry', () => {
    const { features } = detectFeaturesFromContent(`
      ViewModifierRegistry.register("a") { _, _, _ in }
    `);
    expect(features).toContain('SwiftUIModifier');
    expect(features).not.toContain('ComposeModifier');
  });
});

describe('native module file search', () => {
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

  it('finds the @ExpoModule file next to the views module', async () => {
    const iosDir = path.join(tmpDir, 'ios');
    await fs.promises.mkdir(iosDir);
    await fs.promises.writeFile(
      path.join(iosDir, 'FooViewsModule.swift'),
      'public func definition() -> ModuleDefinition { Name("FooViews") }'
    );
    await fs.promises.writeFile(
      path.join(iosDir, 'FooModule.swift'),
      '@ExpoModule("Foo")\npublic class FooModule: Module {}'
    );

    expect(await findExpoModuleFile(tmpDir, 'apple')).toBe(path.join(iosDir, 'FooModule.swift'));
    expect(await findModuleDefinitionFile(tmpDir, 'apple')).toBe(
      path.join(iosDir, 'FooViewsModule.swift')
    );
  });

  it('ignores an @ExpoModule attribute in a comment', async () => {
    const iosDir = path.join(tmpDir, 'ios');
    await fs.promises.mkdir(iosDir);
    await fs.promises.writeFile(
      path.join(iosDir, 'FooModule.swift'),
      '/// Unlike an `@ExpoModule` class, this module uses the Module DSL.\npublic class FooModule: Module {}'
    );

    expect(await findExpoModuleFile(tmpDir, 'apple')).toBeNull();
  });

  it('ignores an @ExpoModule attribute in a block comment', async () => {
    const srcDir = path.join(tmpDir, 'android', 'src');
    await fs.promises.mkdir(srcDir, { recursive: true });
    await fs.promises.writeFile(
      path.join(srcDir, 'FooModule.kt'),
      '/**\n * Migrate this to an `@ExpoModule` class later.\n */\nclass FooModule : Module() {}'
    );

    expect(await findExpoModuleFile(tmpDir, 'android')).toBeNull();
  });
});

describe('detectV2FeaturesFromContent', () => {
  it('detects Swift members with attributes and modifiers on separate lines', () => {
    const { features } = detectV2FeaturesFromContent(`
      @ExpoModule("ExpoHaptics")
      public class HapticsModule: Module {
        @JS
        @MainActor
        func impactAsync(style: ImpactStyle) async {}

        @JS(.concurrent)
        nonisolated func digestAsync(
          algorithm: String,
          data: String
        ) async throws -> String {}

        @JS
        func setValueAsync(value: String = "") async {}
      }
    `);
    expect(features).toEqual(['AsyncFunction']);
  });

  it('detects Swift constants, functions and events', () => {
    const { features } = detectV2FeaturesFromContent(`
      @JS
      let PI: Double = .pi

      @JS("renamed")
      public func hello() -> String { "Hello" }

      @Event("onChange")
      var onChange: (ChangeEventPayload) -> Void
    `);
    expect(features.sort()).toEqual(['Constant', 'Event', 'Function']);
  });

  it('detects Kotlin constants, functions, suspend functions and events', () => {
    const { features } = detectV2FeaturesFromContent(`
      @JS
      @Constant
      val isSupported: Boolean
        get() = true

      @JS
      fun hello() = "Hello"

      @JS
      private suspend fun setValueAsync(value: String) {}

      @Event(name = "onChange")
      private val onChange = event<ChangeEventPayload>()
    `);
    expect(features.sort()).toEqual(['AsyncFunction', 'Constant', 'Event', 'Function']);
  });

  it.each([
    ['Swift', '@ExpoModule("Foo", classes: [FooObject.self, BarObject.self])'],
    ['Kotlin', '@ExpoModule(name = "Foo", classes = [FooObject::class])'],
  ])('detects the first shared object class of the %s module', (_language, annotation) => {
    expect(detectV2FeaturesFromContent(annotation)).toEqual({
      features: ['SharedObject'],
      sharedObjectName: 'FooObject',
    });
  });

  it('reads the shared object classes only from the @ExpoModule arguments', () => {
    expect(
      detectV2FeaturesFromContent(`
        @ExpoModule("Foo")
        public class FooModule: Module {
          let classes = [Bar.self]
        }
      `)
    ).toEqual({ features: [], sharedObjectName: null });
  });

  it('keeps the members after comment markers in string literals', () => {
    const { features } = detectV2FeaturesFromContent(`
      @JS
      let mimeTypes: [String] = ["image/*"]

      @JS
      func hello() -> String { "Hello" }

      /** Loads the value. */
      @JS
      func loadAsync() async {}
    `);
    expect(features.sort()).toEqual(['AsyncFunction', 'Constant', 'Function']);
  });

  it('ignores commented-out members', () => {
    const { features } = detectV2FeaturesFromContent(`
      // @JS func hello() -> String
      // @Event var onChange: () -> Void
    `);
    expect(features).toEqual([]);
  });
});

describe('detectExpoModuleFromContent', () => {
  it.each([
    ['a Swift JS name', '@ExpoModule("ExpoFoo")\npublic class FooModule: Module {}', 'ExpoFoo'],
    [
      'a Swift class with shared objects',
      '@ExpoModule(classes: [Foo.self])\npublic final class FooModule {}',
      'FooModule',
    ],
    [
      'a named Kotlin argument',
      '@ExpoModule(name = "ExpoFoo")\nclass FooModule : Module()',
      'ExpoFoo',
    ],
    [
      'a named Kotlin argument after the classes',
      '@ExpoModule(classes = [FooObject::class], name = "ExpoFoo")\nclass FooModule : Module()',
      'ExpoFoo',
    ],
    ['no arguments', '@ExpoModule\npublic class FooModule: Module {}', 'FooModule'],
  ])('reads the names with %s', (_label, content, name) => {
    expect(detectExpoModuleFromContent(content)).toEqual({ name, moduleName: 'FooModule' });
  });

  it('returns null without an @ExpoModule class', () => {
    expect(detectExpoModuleFromContent('public class FooModule: Module {}')).toBeNull();
  });
});
