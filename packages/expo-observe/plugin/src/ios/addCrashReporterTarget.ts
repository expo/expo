import { XcodeProject } from 'expo/config-plugins';

// CrashReportExtension is available on iOS 27 and later. The app keeps its own, lower deployment
// target: older systems ignore the embedded extension.
const DEPLOYMENT_TARGET = '27.0';

// Values below match what Xcode 27 generates for an ExtensionKit extension target (see the
// `wrapper.extensionkit-extension` file type in Xcode's build system specifications).
const PRODUCT_TYPE = 'com.apple.product-type.extensionkit-extension';
const PRODUCT_FILE_TYPE = 'wrapper.extensionkit-extension';
const EMBED_PHASE_NAME = 'Embed ExtensionKit Extensions';
const EMBED_PHASE_DESTINATION = 16;
const EMBED_PHASE_PATH = '$(EXTENSIONS_FOLDER_PATH)';

type Objects = Record<string, any>;
type Reference = { value: string; comment: string };

type CrashReporterTargetProps = {
  targetName: string;
  bundleIdentifier: string;
  marketingVersion: string;
  buildNumber: string;
  developmentTeam?: string;
};

/**
 * Adds the crash reporter extension target to the Xcode project and embeds it in the app target.
 * When the project already has the target, only updates its build settings, so that changed
 * options apply without a clean prebuild.
 */
export function addCrashReporterTarget(project: XcodeProject, props: CrashReporterTargetProps) {
  const { targetName } = props;
  const appTarget = project.getFirstTarget().firstTarget;
  const existingTarget = project.pbxTargetByName(targetName);
  if (existingTarget) {
    updateBuildSettings(project, existingTarget, appTarget, props);
    return;
  }
  const objects: Objects = project.hash.project.objects;
  const projectUuid: string = project.getFirstProject().uuid;
  const projectObject = objects.PBXProject[projectUuid];
  const sourceFileName = `${targetName}.swift`;
  const productName = `${targetName}.appex`;

  // Files
  const productFile = addObject(project, 'PBXFileReference', productName, {
    explicitFileType: quote(PRODUCT_FILE_TYPE),
    includeInIndex: 0,
    path: quote(productName),
    sourceTree: 'BUILT_PRODUCTS_DIR',
  });
  const sourceFile = addObject(project, 'PBXFileReference', sourceFileName, {
    lastKnownFileType: 'sourcecode.swift',
    path: quote(sourceFileName),
    sourceTree: quote('<group>'),
  });
  const infoPlistFile = addObject(project, 'PBXFileReference', 'Info.plist', {
    lastKnownFileType: 'text.plist.xml',
    path: 'Info.plist',
    sourceTree: quote('<group>'),
  });
  const group = addObject(project, 'PBXGroup', targetName, {
    children: [sourceFile, infoPlistFile],
    path: quote(targetName),
    sourceTree: quote('<group>'),
  });
  objects.PBXGroup[projectObject.mainGroup].children.push(group);
  findGroup(objects, 'Products')?.children.push(productFile);

  // Extension target
  const sourceBuildFile = addObject(project, 'PBXBuildFile', `${sourceFileName} in Sources`, {
    fileRef: sourceFile.value,
    fileRef_comment: sourceFile.comment,
  });
  const buildPhases = [
    addBuildPhase(project, 'PBXSourcesBuildPhase', 'Sources', [sourceBuildFile]),
    addBuildPhase(project, 'PBXFrameworksBuildPhase', 'Frameworks', []),
    addBuildPhase(project, 'PBXResourcesBuildPhase', 'Resources', []),
  ];
  const configurationList = addConfigurationList(project, appTarget, props);
  const target = addObject(project, 'PBXNativeTarget', targetName, {
    buildConfigurationList: configurationList.value,
    buildConfigurationList_comment: configurationList.comment,
    buildPhases,
    buildRules: [],
    dependencies: [],
    name: quote(targetName),
    productName: quote(targetName),
    productReference: productFile.value,
    productReference_comment: productFile.comment,
    productType: quote(PRODUCT_TYPE),
  });
  projectObject.targets.push(target);
  projectObject.attributes.TargetAttributes ??= {};
  projectObject.attributes.TargetAttributes[target.value] = { CreatedOnToolsVersion: '27.0' };

  // Embed the extension in the app and build it before the app.
  const embedBuildFile = addObject(
    project,
    'PBXBuildFile',
    `${productName} in ${EMBED_PHASE_NAME}`,
    {
      fileRef: productFile.value,
      fileRef_comment: productFile.comment,
      settings: { ATTRIBUTES: ['RemoveHeadersOnCopy'] },
    }
  );
  const embedPhase = addBuildPhase(project, 'PBXCopyFilesBuildPhase', EMBED_PHASE_NAME, [
    embedBuildFile,
  ]);
  Object.assign(objects.PBXCopyFilesBuildPhase[embedPhase.value], {
    dstPath: quote(EMBED_PHASE_PATH),
    dstSubfolderSpec: EMBED_PHASE_DESTINATION,
    name: quote(EMBED_PHASE_NAME),
  });
  appTarget.buildPhases.push(embedPhase);

  const proxy = addObject(project, 'PBXContainerItemProxy', 'PBXContainerItemProxy', {
    containerPortal: projectUuid,
    containerPortal_comment: 'Project object',
    proxyType: 1,
    remoteGlobalIDString: target.value,
    remoteInfo: quote(targetName),
  });
  const dependency = addObject(project, 'PBXTargetDependency', 'PBXTargetDependency', {
    target: target.value,
    target_comment: targetName,
    targetProxy: proxy.value,
    targetProxy_comment: proxy.comment,
  });
  appTarget.dependencies ??= [];
  appTarget.dependencies.push(dependency);
}

function addConfigurationList(
  project: XcodeProject,
  appTarget: { buildConfigurationList: string },
  props: CrashReporterTargetProps
): Reference {
  const objects: Objects = project.hash.project.objects;
  const appConfigurationList = objects.XCConfigurationList[appTarget.buildConfigurationList];
  const appConfigurations: Reference[] = appConfigurationList.buildConfigurations;

  // Mirror the app's configurations, so that every configuration the app builds with also
  // exists for the extension.
  const configurations = appConfigurations.map(({ value, comment: name }) =>
    addObject(project, 'XCBuildConfiguration', name, {
      buildSettings: getBuildSettings(props, objects.XCBuildConfiguration[value].buildSettings),
      name: quote(name),
    })
  );

  return addObject(
    project,
    'XCConfigurationList',
    `Build configuration list for PBXNativeTarget "${props.targetName}"`,
    {
      buildConfigurations: configurations,
      defaultConfigurationIsVisible: 0,
      defaultConfigurationName: appConfigurationList.defaultConfigurationName,
    }
  );
}

/**
 * Overwrites the settings the plugin manages in every configuration of an existing target, and
 * keeps any other settings, for example ones added in Xcode.
 */
function updateBuildSettings(
  project: XcodeProject,
  target: { buildConfigurationList: string },
  appTarget: { buildConfigurationList: string },
  props: CrashReporterTargetProps
) {
  const objects: Objects = project.hash.project.objects;
  const getConfigurations = (listUuid: string) =>
    (objects.XCConfigurationList[listUuid].buildConfigurations as Reference[]).map(
      ({ value }) => objects.XCBuildConfiguration[value]
    );
  const appConfigurations = getConfigurations(appTarget.buildConfigurationList);

  for (const configuration of getConfigurations(target.buildConfigurationList)) {
    const appConfiguration = appConfigurations.find(({ name }) => name === configuration.name);
    Object.assign(
      configuration.buildSettings,
      getBuildSettings(props, appConfiguration?.buildSettings ?? {})
    );
  }
}

/**
 * The build settings the plugin manages for one configuration of the extension target.
 */
function getBuildSettings(
  props: CrashReporterTargetProps,
  appSettings: Record<string, unknown>
): Record<string, unknown> {
  const developmentTeam = props.developmentTeam ?? appSettings.DEVELOPMENT_TEAM;
  // Build unoptimized and with the DEBUG condition wherever the app does, so that the extension
  // can be debugged in the same configurations as the app.
  const isUnoptimized = unquote(appSettings.SWIFT_OPTIMIZATION_LEVEL) === '-Onone';
  return {
    CODE_SIGN_STYLE: 'Automatic',
    CURRENT_PROJECT_VERSION: quote(props.buildNumber),
    ...(typeof developmentTeam === 'string' ? { DEVELOPMENT_TEAM: quote(developmentTeam) } : {}),
    GENERATE_INFOPLIST_FILE: 'YES',
    INFOPLIST_FILE: quote(`${props.targetName}/Info.plist`),
    INFOPLIST_KEY_CFBundleDisplayName: quote(props.targetName),
    IPHONEOS_DEPLOYMENT_TARGET: DEPLOYMENT_TARGET,
    LD_RUNPATH_SEARCH_PATHS: quote(
      '$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks'
    ),
    MARKETING_VERSION: quote(props.marketingVersion),
    PRODUCT_BUNDLE_IDENTIFIER: quote(props.bundleIdentifier),
    PRODUCT_NAME: quote('$(TARGET_NAME)'),
    SDKROOT: 'iphoneos',
    SKIP_INSTALL: 'YES',
    SWIFT_VERSION: '6.0',
    TARGETED_DEVICE_FAMILY: quote('1,2'),
    ...(isUnoptimized
      ? {
          SWIFT_ACTIVE_COMPILATION_CONDITIONS: quote('DEBUG $(inherited)'),
          SWIFT_OPTIMIZATION_LEVEL: quote('-Onone'),
        }
      : {}),
  };
}

function addBuildPhase(
  project: XcodeProject,
  isa: string,
  name: string,
  files: Reference[]
): Reference {
  return addObject(project, isa, name, {
    buildActionMask: 2147483647,
    files,
    runOnlyForDeploymentPostprocessing: 0,
  });
}

/**
 * Adds an object to its section, creating the section when the project has none yet, and returns
 * a reference to it in the `{ value, comment }` form the `xcode` package serializes.
 */
function addObject(
  project: XcodeProject,
  isa: string,
  comment: string,
  properties: Record<string, unknown>
): Reference {
  const objects: Objects = project.hash.project.objects;
  const uuid: string = project.generateUuid();
  objects[isa] ??= {};
  objects[isa][uuid] = { isa, ...properties };
  objects[isa][`${uuid}_comment`] = comment;
  return { value: uuid, comment };
}

function findGroup(objects: Objects, name: string): { children: Reference[] } | undefined {
  const groups: any[] = Object.values(objects.PBXGroup);
  return groups.find(
    (group) => typeof group === 'object' && (group.name === name || group.path === name)
  );
}

/**
 * Quotes a value unless the pbxproj format allows it bare or it is quoted already, as values read
 * from the project can be.
 */
function quote(value: string): string {
  return /^[\w$/.]+$/.test(value) || /^".*"$/.test(value) ? value : `"${value}"`;
}

function unquote(value: unknown): string | undefined {
  return typeof value === 'string' ? value.replace(/^"(.*)"$/, '$1') : undefined;
}
