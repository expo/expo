import type { XcodeProject } from 'expo/config-plugins';

type PbxObject = Record<string, any>;
type PbxArrayMember = { value: string; comment: string };

const WIDGETS_PACKAGE_PATH = 'build/generated/autolinking/expo/direct/expo-widgets';
const WIDGETS_PRODUCT_NAME = 'ExpoWidgets';
const REACT_NATIVE_XCCONFIG_PATH = 'ReactNativeSPM/ReactNativeSPM.xcconfig';
const REACT_NATIVE_XCCONFIG_NAME = 'ReactNativeSPM.xcconfig';

const runWidgetsScript = (script: string) => `set -eo pipefail

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

EXPO_WIDGETS_DIR="$("$NODE_BINARY" --print "require('path').dirname(require.resolve('expo-widgets/package.json', { paths: [process.argv[1]] }))" "$PROJECT_ROOT" 2>/dev/null || true)"
if [ -z "$EXPO_WIDGETS_DIR" ]; then
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
  const target = objectSection(xcodeProject, 'PBXNativeTarget')[targetUuid]!;

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

function addWidgetsProductDependency(xcodeProject: XcodeProject, target: PbxObject): string {
  const project: PbxObject = xcodeProject.getFirstProject().firstProject;
  const references = objectSection(xcodeProject, 'XCLocalSwiftPackageReference');
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

  const dependencies = objectSection(xcodeProject, 'XCSwiftPackageProductDependency');
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
  target: PbxObject,
  productDependencyUuid: string
) {
  const frameworksPhases = objectSection(xcodeProject, 'PBXFrameworksBuildPhase');
  const phase = target.buildPhases
    .map(({ value }: PbxArrayMember) => frameworksPhases[value])
    .find(Boolean);
  const buildFiles = objectSection(xcodeProject, 'PBXBuildFile');
  const isLinked = phase.files.some(
    ({ value }: PbxArrayMember) => buildFiles[value]?.productRef === productDependencyUuid
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
    objectSection(xcodeProject, 'PBXFileReference'),
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

function targetConfigurations(xcodeProject: XcodeProject, target: PbxObject): PbxObject[] {
  const list = objectSection(xcodeProject, 'XCConfigurationList')[target.buildConfigurationList]!;
  const configurations = objectSection(xcodeProject, 'XCBuildConfiguration');
  return list.buildConfigurations.map(({ value }: PbxArrayMember) => configurations[value]!);
}

/**
 * Adds the phase in front of the `before` phase, or last when the target has none. An existing
 * phase keeps its position and gets the current script.
 */
function setShellScriptPhase(
  xcodeProject: XcodeProject,
  target: PbxObject,
  { name, before, script }: { name: string; before: string; script: string }
) {
  const phases = objectSection(xcodeProject, 'PBXShellScriptBuildPhase');
  const shellScript = quote(script);
  const existing = target.buildPhases.find(
    ({ value, comment }: PbxArrayMember) => comment === name && phases[value]
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

  const beforeIndex = target.buildPhases.findIndex(
    ({ comment }: PbxArrayMember) => comment === before
  );
  target.buildPhases.splice(beforeIndex === -1 ? target.buildPhases.length : beforeIndex, 0, {
    value: uuid,
    comment: name,
  });
}

/** An `objects` section of the pbxproj. Its `<uuid>_comment` keys hold strings, not objects. */
function objectSection(xcodeProject: XcodeProject, isa: string): Record<string, PbxObject> {
  const objects: Record<string, Record<string, PbxObject>> = xcodeProject.hash.project.objects;
  objects[isa] ??= {};
  return objects[isa];
}

function addObject(
  xcodeProject: XcodeProject,
  section: Record<string, PbxObject>,
  { object, comment }: { object: PbxObject; comment: string }
): string {
  const uuid = xcodeProject.generateUuid();
  section[uuid] = object;
  (section as Record<string, unknown>)[`${uuid}_comment`] = comment;
  return uuid;
}

function findOrAddObject(
  xcodeProject: XcodeProject,
  section: Record<string, PbxObject>,
  matches: (object: PbxObject) => boolean,
  entry: { object: PbxObject; comment: string }
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
