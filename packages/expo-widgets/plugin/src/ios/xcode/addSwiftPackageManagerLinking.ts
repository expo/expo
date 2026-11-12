import type { XcodeProject } from 'expo/config-plugins';

type PbxArrayMember = { value: string; comment: string };

interface PbxProject {
  packageReferences?: PbxArrayMember[];
}
interface PbxNativeTarget {
  buildConfigurationList: string;
  buildPhases: PbxArrayMember[];
  packageProductDependencies?: PbxArrayMember[];
}
interface PbxBuildPhase {
  files: PbxArrayMember[];
}
interface PbxShellScriptBuildPhase extends PbxBuildPhase {
  shellScript: string;
}
interface PbxBuildFile {
  productRef?: string;
}
interface PbxFileReference {
  path?: string;
}
interface XCConfigurationList {
  buildConfigurations: PbxArrayMember[];
}
interface XCBuildConfiguration {
  baseConfigurationReference?: string;
  baseConfigurationReference_comment?: string;
  buildSettings: Record<string, unknown>;
}
interface XCLocalSwiftPackageReference {
  relativePath: string;
}
interface XCSwiftPackageProductDependency {
  package: string;
  productName: string;
}

/** The `isa` and the other keys that the pbxproj writes but this file never reads back. */
type PbxObjectFields = { isa: string } & Record<string, unknown>;

const WIDGETS_PACKAGE_PATH = 'build/generated/autolinking/expo/direct/expo-widgets';
const WIDGETS_PRODUCT_NAME = 'ExpoWidgets';
const REACT_NATIVE_XCCONFIG_PATH = 'ReactNativeSPM/ReactNativeSPM.xcconfig';
const REACT_NATIVE_XCCONFIG_NAME = 'ReactNativeSPM.xcconfig';

const runWidgetsScript = (script: string) => `set -eo pipefail

if [ -n "\${PODS_ROOT:-}" ]; then
  exit 0
fi

if [ -z "\${NODE_BINARY:-}" ]; then
  set +e
  if [ -f "$SRCROOT/.xcode.env" ]; then . "$SRCROOT/.xcode.env"; fi
  if [ -f "$SRCROOT/.xcode.env.local" ]; then . "$SRCROOT/.xcode.env.local"; fi
  set -e
fi
export NODE_BINARY="\${NODE_BINARY:-$(command -v node || true)}"
if [ -z "$NODE_BINARY" ]; then
  echo "error: expo-widgets could not find node. Set NODE_BINARY in $SRCROOT/.xcode.env, then build again." >&2
  exit 1
fi
export PROJECT_ROOT="\${PROJECT_ROOT:-$(cd "$SRCROOT/.." && pwd)}"

if ! EXPO_WIDGETS_DIR="$("$NODE_BINARY" --print "require('path').dirname(require.resolve('expo-widgets/package.json', { paths: [process.argv[1]] }))" "$PROJECT_ROOT")"; then
  echo "error: expo-widgets could not be resolved from $PROJECT_ROOT. Install the app's dependencies, then build again." >&2
  exit 1
fi
exec /bin/bash "$EXPO_WIDGETS_DIR/scripts/${script}"
`;

/**
 * Links the widget extension against the expo-widgets Swift package when the app uses Swift
 * Package Manager instead of CocoaPods. Every step finds its entry before it adds one, so running
 * prebuild again changes nothing.
 */
export function addSwiftPackageManagerLinking(
  xcodeProject: XcodeProject,
  { targetUuid }: { targetUuid: string }
) {
  const target = objectSection<PbxNativeTarget>(xcodeProject, 'PBXNativeTarget')[targetUuid]!;

  const productDependencyUuid = addWidgetsProductDependency(xcodeProject, target);
  addProductToFrameworksPhase(xcodeProject, target, productDependencyUuid);

  const xcconfigUuid = findOrAddReactNativeXcconfig(xcodeProject);
  for (const configuration of targetConfigurations(xcodeProject, target)) {
    configuration.baseConfigurationReference = xcconfigUuid;
    configuration.baseConfigurationReference_comment = REACT_NATIVE_XCCONFIG_NAME;
    configuration.buildSettings.LD_RUNPATH_SEARCH_PATHS = [
      '"$(inherited)"',
      '"@executable_path/../../Frameworks"',
    ];
  }

  // Xcode can link the extension before a script phase between Sources and Frameworks runs, and
  // the link then fails because ExpoModulesJSI.framework does not exist yet.
  setShellScriptPhase(xcodeProject, target, {
    name: 'Build ExpoModulesJSI',
    before: 'Sources',
    script: runWidgetsScript('xcode-swiftpm-build-expo-modules-jsi.sh'),
  });
  setShellScriptPhase(xcodeProject, target, {
    name: 'Build ExpoWidgets Bundle',
    before: 'Resources',
    script: runWidgetsScript('xcode-swiftpm-build-bundle.sh'),
  });
}

function addWidgetsProductDependency(xcodeProject: XcodeProject, target: PbxNativeTarget): string {
  const { firstProject } = xcodeProject.getFirstProject();
  const project: typeof firstProject & PbxProject = firstProject;
  const references = objectSection<XCLocalSwiftPackageReference>(
    xcodeProject,
    'XCLocalSwiftPackageReference'
  );
  const referenceComment = `XCLocalSwiftPackageReference "${WIDGETS_PACKAGE_PATH}"`;
  const referenceUuid = findOrAddObject(
    xcodeProject,
    references,
    (reference) => unquote(reference.relativePath) === WIDGETS_PACKAGE_PATH,
    {
      object: { isa: 'XCLocalSwiftPackageReference', relativePath: WIDGETS_PACKAGE_PATH },
      comment: referenceComment,
    }
  );
  project.packageReferences = withMember(project.packageReferences, {
    value: referenceUuid,
    comment: referenceComment,
  });

  const dependencies = objectSection<XCSwiftPackageProductDependency>(
    xcodeProject,
    'XCSwiftPackageProductDependency'
  );
  const dependencyUuid = findOrAddObject(
    xcodeProject,
    dependencies,
    (dependency) =>
      dependency.package === referenceUuid && dependency.productName === WIDGETS_PRODUCT_NAME,
    {
      object: {
        isa: 'XCSwiftPackageProductDependency',
        package: referenceUuid,
        package_comment: referenceComment,
        productName: WIDGETS_PRODUCT_NAME,
      },
      comment: WIDGETS_PRODUCT_NAME,
    }
  );
  target.packageProductDependencies = withMember(target.packageProductDependencies, {
    value: dependencyUuid,
    comment: WIDGETS_PRODUCT_NAME,
  });
  return dependencyUuid;
}

function addProductToFrameworksPhase(
  xcodeProject: XcodeProject,
  target: PbxNativeTarget,
  productDependencyUuid: string
) {
  const frameworksPhases = objectSection<PbxBuildPhase>(xcodeProject, 'PBXFrameworksBuildPhase');
  const phase = target.buildPhases.map(({ value }) => frameworksPhases[value]).find(Boolean)!;
  const buildFiles = objectSection<PbxBuildFile>(xcodeProject, 'PBXBuildFile');
  const isLinked = phase.files.some(
    ({ value }) => buildFiles[value]?.productRef === productDependencyUuid
  );
  if (isLinked) {
    return;
  }
  const comment = `${WIDGETS_PRODUCT_NAME} in Frameworks`;
  const buildFileUuid = addObject(xcodeProject, buildFiles, {
    object: {
      isa: 'PBXBuildFile',
      productRef: productDependencyUuid,
      productRef_comment: WIDGETS_PRODUCT_NAME,
    },
    comment,
  });
  phase.files.push({ value: buildFileUuid, comment });
}

function findOrAddReactNativeXcconfig(xcodeProject: XcodeProject): string {
  return findOrAddObject(
    xcodeProject,
    objectSection<PbxFileReference>(xcodeProject, 'PBXFileReference'),
    (fileReference) => unquote(fileReference.path ?? '') === REACT_NATIVE_XCCONFIG_PATH,
    {
      object: {
        isa: 'PBXFileReference',
        lastKnownFileType: 'text.xcconfig',
        name: REACT_NATIVE_XCCONFIG_NAME,
        path: REACT_NATIVE_XCCONFIG_PATH,
        sourceTree: 'SOURCE_ROOT',
      },
      comment: REACT_NATIVE_XCCONFIG_NAME,
    }
  );
}

function targetConfigurations(
  xcodeProject: XcodeProject,
  target: PbxNativeTarget
): XCBuildConfiguration[] {
  const list = objectSection<XCConfigurationList>(xcodeProject, 'XCConfigurationList')[
    target.buildConfigurationList
  ]!;
  const configurations = objectSection<XCBuildConfiguration>(xcodeProject, 'XCBuildConfiguration');
  return list.buildConfigurations.map(({ value }) => configurations[value]!);
}

/**
 * Adds the phase in front of the `before` phase, or last when the target has none. An existing
 * phase keeps its position and gets the current script.
 */
function setShellScriptPhase(
  xcodeProject: XcodeProject,
  target: PbxNativeTarget,
  { name, before, script }: { name: string; before: string; script: string }
) {
  const phases = objectSection<PbxShellScriptBuildPhase>(xcodeProject, 'PBXShellScriptBuildPhase');
  const shellScript = quote(script);
  const existing = target.buildPhases.find(
    ({ value, comment }) => comment === name && phases[value]
  );
  if (existing) {
    phases[existing.value]!.shellScript = shellScript;
    return;
  }

  const uuid = addObject(xcodeProject, phases, {
    object: {
      isa: 'PBXShellScriptBuildPhase',
      alwaysOutOfDate: 1,
      buildActionMask: 2147483647,
      files: [],
      inputFileListPaths: [],
      inputPaths: [],
      name: quote(name),
      outputFileListPaths: [],
      outputPaths: [],
      runOnlyForDeploymentPostprocessing: 0,
      shellPath: '/bin/bash',
      shellScript,
    },
    comment: name,
  });

  const beforeIndex = target.buildPhases.findIndex(({ comment }) => comment === before);
  target.buildPhases.splice(beforeIndex === -1 ? target.buildPhases.length : beforeIndex, 0, {
    value: uuid,
    comment: name,
  });
}

/** An `objects` section of the pbxproj. Its `<uuid>_comment` keys hold strings, not objects. */
function objectSection<T>(xcodeProject: XcodeProject, isa: string): Record<string, T> {
  const objects = xcodeProject.hash.project.objects as unknown as Record<
    string,
    Record<string, T> | undefined
  >;
  return (objects[isa] ??= {});
}

function addObject<T>(
  xcodeProject: XcodeProject,
  section: Record<string, T>,
  { object, comment }: { object: T & PbxObjectFields; comment: string }
): string {
  const uuid = xcodeProject.generateUuid();
  section[uuid] = object;
  (section as Record<string, unknown>)[`${uuid}_comment`] = comment;
  return uuid;
}

function findOrAddObject<T>(
  xcodeProject: XcodeProject,
  section: Record<string, T>,
  matches: (object: T) => boolean,
  entry: { object: T & PbxObjectFields; comment: string }
): string {
  const existing = Object.keys(section).find(
    (key) => !key.endsWith('_comment') && matches(section[key]!)
  );
  return existing ?? addObject(xcodeProject, section, entry);
}

function withMember(members: PbxArrayMember[] | undefined, member: PbxArrayMember) {
  const current = members ?? [];
  return current.some(({ value }) => value === member.value) ? current : [...current, member];
}

function unquote(value: string): string {
  return value.replace(/^"(.*)"$/, '$1');
}

function quote(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
}
