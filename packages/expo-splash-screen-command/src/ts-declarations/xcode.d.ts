declare module 'xcode' {
  /**
   * UUID that is a key to each fragment of PBXProject.
   */
  type UUID = string;

  /**
   * if has following format `${UUID}_comment`
   */
  type UUIDComment = string;

  interface PBXFile {
    basename: string;
    lastKnownFileType?: string;
    group?: string;
    path?: string;
    fileEncoding?: number;
    defaultEncoding?: number;
    sourceTree: string;
    includeInIndex: number;
    explicitFileType?: unknown;
    settings?: object;
    uuid?: string;
    fileRef: string;
    target?: string;
  }

  interface PBXProject {
    isa: 'PBXProject';
    attributes: object;
    buildConfigurationList: UUID;
    buildConfigurationList_comment: string;
    compatibilityVersion: string;
    developmentRegion: string;
    hasScannedForEncodings: number;
    knownRegions: unknown[];
    mainGroup: UUID;
    productRefGroup: UUID;
    productRefGroup_comment: string;
    projectDirPath: string;
    projectRoot: string;
    targets: unknown[];
  }

  interface PBXNativeTarget {
    isa: 'PBXNativeTarget';
    buildConfigurationList: UUID;
    buildConfigurationList_comment: string;
    buildPhases: {
      value: UUID;
      comment: string;
    }[];
    buildRules: [];
    dependencies: [];
    name: string;
    productName: string;
    productReference: UUID;
    productReference_comment: string;
    productType: string;
  }

  type ProductType =
    | 'com.apple.product-type.application'
    | 'com.apple.product-type.app-extension'
    | 'com.apple.product-type.bundle'
    | 'com.apple.product-type.tool'
    | 'com.apple.product-type.library.dynamic'
    | 'com.apple.product-type.framework'
    | 'com.apple.product-type.library.static'
    | 'com.apple.product-type.bundle.unit-test'
    | 'com.apple.product-type.application.watchapp'
    | 'com.apple.product-type.application.watchapp2'
    | 'com.apple.product-type.watchkit-extension'
    | 'com.apple.product-type.watchkit2-extension';

  interface PBXGroup {
    isa: 'PBXGroup';
    children: {
      value: UUID;
      comment?: string;
    }[];
    name: string;
    path?: string;
    sourceTree: '"<group>"' | unknown;
  }

  export class project {
    constructor(pbxprojPath: string);

    /**
     * `.pbxproj` file path.
     */
    filepath: string;

    hash: {
      headComment: string;
      project: unknown;
    };

    // ------------------------------------------------------------------------
    //
    // `.pbxproj` related operation - starting & ending point.
    //
    // ------------------------------------------------------------------------

    /**
     * First step to be executed while working with `.pbxproj` file.
     */
    parse(callback?: (err: Error | null, results?: string) => void): this;

    /**
     * @returns Content of .pbxproj file.
     */
    writeSync(options?: { omitEmptyValues?: boolean }): string;

    allUuids(): UUID[];
    generateUuid(): UUID;

    addPluginFile(path: unknown, opt: unknown): unknown;
    removePluginFile(path: unknown, opt: unknown): unknown;
    addProductFile(targetPath: unknown, opt: unknown): unknown;
    removeProductFile(path: unknown, opt: unknown): unknown;
    addSourceFile(path: string, opt: unknown, group: string): unknown;
    removeSourceFile(path: string, opt: unknown, group: string): unknown;
    addHeaderFile(path: string, opt: unknown, group: string): unknown;
    removeHeaderFile(path: string, opt: unknown, group: string): unknown;
    addResourceFile(path: string, opt: unknown, group: string): unknown;
    removeResourceFile(path: string, opt: unknown, group: string): unknown;
    addFramework(fpath: unknown, opt: unknown): unknown;
    removeFramework(fpath: unknown, opt: unknown): unknown;
    addCopyfile(fpath: unknown, opt: unknown): unknown;
    pbxCopyfilesBuildPhaseObj(target: unknown): unknown;
    addToPbxCopyfilesBuildPhase(file: unknown): void;
    removeCopyfile(fpath: unknown, opt: unknown): unknown;
    removeFromPbxCopyfilesBuildPhase(file: unknown): void;
    addStaticLibrary(path: unknown, opt: unknown): unknown;
    /**
     * Adds to `PBXBuildFile` section
     */
    addToPbxBuildFileSection(file: PBXFile): void;
    removeFromPbxBuildFileSection(file: unknown): void;
    addPbxGroup(
      filePathsArray: string[],
      name: string,
      path: string,
      sourceTree?: string
    ): { uuid: UUID; pbxGroup: PBXGroup };
    removePbxGroup(groupName: unknown): void;
    addToPbxProjectSection(target: unknown): void;
    addToPbxNativeTargetSection(target: unknown): void;
    addToPbxFileReferenceSection(file: unknown): void;
    removeFromPbxFileReferenceSection(file: unknown): unknown;
    addToXcVersionGroupSection(file: unknown): void;
    addToPluginsPbxGroup(file: unknown): void;
    removeFromPluginsPbxGroup(file: unknown): unknown;
    addToResourcesPbxGroup(file: unknown): void;
    removeFromResourcesPbxGroup(file: unknown): unknown;
    addToFrameworksPbxGroup(file: unknown): void;
    removeFromFrameworksPbxGroup(file: unknown): unknown;
    addToPbxEmbedFrameworksBuildPhase(file: unknown): void;
    removeFromPbxEmbedFrameworksBuildPhase(file: unknown): void;
    addToProductsPbxGroup(file: unknown): void;
    removeFromProductsPbxGroup(file: unknown): unknown;
    addToPbxSourcesBuildPhase(file: unknown): void;
    removeFromPbxSourcesBuildPhase(file: unknown): void;
    /**
     * Adds to PBXResourcesBuildPhase` section
     * @param resourcesBuildPhaseSectionKey Because there's might more than one `Resources` build phase we need to ensure file is placed under correct one.
     */
    addToPbxResourcesBuildPhase(file: PBXFile): void;
    removeFromPbxResourcesBuildPhase(file: unknown): void;
    addToPbxFrameworksBuildPhase(file: unknown): void;
    removeFromPbxFrameworksBuildPhase(file: unknown): void;
    addXCConfigurationList(
      configurationObjectsArray: unknown,
      defaultConfigurationName: unknown,
      comment: unknown
    ): {
      uuid: unknown;
      xcConfigurationList: {
        isa: string;
        buildConfigurations: unknown[];
        defaultConfigurationIsVisible: number;
        defaultConfigurationName: unknown;
      };
    };
    addTargetDependency(
      target: unknown,
      dependencyTargets: unknown
    ): {
      uuid: unknown;
      target: unknown;
    };
    addBuildPhase(
      filePathsArray: unknown,
      buildPhaseType: unknown,
      comment: unknown,
      target: unknown,
      optionsOrFolderType: unknown,
      subfolderPath: unknown
    ): {
      uuid: unknown;
      buildPhase: {
        isa: unknown;
        buildActionMask: number;
        files: unknown[];
        runOnlyForDeploymentPostprocessing: number;
      };
    };
    /**
     * Retrieves main part describing PBXProjects that are available in `.pbxproj` file.
     */
    pbxProjectSection(): { [key: UUID]: PBXProject };
    pbxBuildFileSection(): unknown;
    pbxXCBuildConfigurationSection(): unknown;
    pbxFileReferenceSection(): Record<UUID, PBXFile> & Record<UUIDComment, string>;
    pbxNativeTargetSection(): unknown;
    xcVersionGroupSection(): unknown;
    pbxXCConfigurationList(): unknown;
    pbxGroupByName(name: unknown): unknown;
    /**
     * @param targetName in most cases it's the name of the application
     */
    pbxTargetByName(targetName: string): PBXNativeTarget | undefined;
    findTargetKey(name: unknown): string;
    pbxItemByComment(name: unknown, pbxSectionName: unknown): unknown;
    pbxSourcesBuildPhaseObj(target: unknown): unknown;
    pbxResourcesBuildPhaseObj(target: unknown): unknown;
    pbxFrameworksBuildPhaseObj(target: unknown): unknown;
    pbxEmbedFrameworksBuildPhaseObj(target: unknown): unknown;
    buildPhase(group: unknown, target: unknown): string;
    buildPhaseObject(name: unknown, group: unknown, target: unknown): unknown;
    addBuildProperty(prop: unknown, value: unknown, build_name: unknown): void;
    removeBuildProperty(prop: unknown, build_name: unknown): void;
    updateBuildProperty(prop: string, value: unknown, build: string): void;
    updateProductName(name: unknown): void;
    removeFromFrameworkSearchPaths(file: unknown): void;
    addToFrameworkSearchPaths(file: unknown): void;
    removeFromLibrarySearchPaths(file: unknown): void;
    addToLibrarySearchPaths(file: unknown): void;
    removeFromHeaderSearchPaths(file: unknown): void;
    addToHeaderSearchPaths(file: unknown): void;
    addToOtherLinkerFlags(flag: unknown): void;
    removeFromOtherLinkerFlags(flag: unknown): void;
    addToBuildSettings(buildSetting: unknown, value: unknown): void;
    removeFromBuildSettings(buildSetting: unknown): void;
    /**
     * Checks whether there is a file with given `filePath` in the project.
     */
    hasFile(filePath): PBXFile | false;
    addTarget(
      name: unknown,
      type: unknown,
      subfolder: unknown
    ): {
      uuid: unknown;
      pbxNativeTarget: {
        isa: string;
        name: string;
        productName: string;
        productReference: unknown;
        productType: string;
        buildConfigurationList: unknown;
        buildPhases: unknown[];
        buildRules: unknown[];
        dependencies: unknown[];
      };
    };
    /**
     * Get First PBXProject that can be found in `.pbxproj` file.
     */
    getFirstProject(): { uuid: UUID; firstProject: PBXProject };
    getFirstTarget(): {
      uuid: unknown;
      firstTarget: unknown;
    };
    /**
     * Retrieves PBXNativeTarget by the type
     */
    getTarget(productType: ProductType): { uuid: UUID; target: PBXNativeTarget } | null;
    addToPbxGroupType(file: unknown, groupKey: unknown, groupType: unknown): void;
    addToPbxVariantGroup(file: unknown, groupKey: unknown): void;
    addToPbxGroup(file: PBXFile, groupKey: UUID): void;
    pbxCreateGroupWithType(name: unknown, pathName: unknown, groupType: unknown): unknown;
    pbxCreateVariantGroup(name: unknown): unknown;
    pbxCreateGroup(name: unknown, pathName: unknown): unknown;
    removeFromPbxGroupAndType(file: unknown, groupKey: unknown, groupType: unknown): void;
    removeFromPbxGroup(file: unknown, groupKey: unknown): void;
    removeFromPbxVariantGroup(file: unknown, groupKey: unknown): void;
    getPBXGroupByKeyAndType(key: unknown, groupType: unknown): unknown;
    /**
     * @param groupKey UUID.
     */
    getPBXGroupByKey(groupKey: string): PBXGroup | undefined;
    getPBXVariantGroupByKey(key: unknown): unknown;
    findPBXGroupKeyAndType(criteria: unknown, groupType: unknown): string;
    /**
     * @param criteria Params that should be used to locate desired PBXGroup.
     */
    findPBXGroupKey(criteria: { name?: string; path?: string }): UUID | undefined;
    findPBXVariantGroupKey(criteria: unknown): string;
    addLocalizationVariantGroup(
      name: unknown
    ): {
      uuid: unknown;
      fileRef: unknown;
      basename: unknown;
    };
    addKnownRegion(name: unknown): void;
    removeKnownRegion(name: unknown): void;
    hasKnownRegion(name: unknown): boolean;
    getPBXObject(name: unknown): unknown;
    /**
     * - creates `PBXFile`
     * - adds to `PBXFileReference` section
     * - adds to `PBXGroup` or `PBXVariantGroup` if applicable
     * @returns `null` if file is already in `pbxproj`.
     */
    addFile(
      path: string,
      group?: string,
      opt?: {
        plugin?: string;
        target?: string;
        variantGroup?: string;
        lastKnownFileType?: string;
        defaultEncoding?: 4;
        customFramework?: true;
        explicitFileType?: number;
        weak?: true;
        compilerFLags?: string;
        embed?: boolean;
        sign?: boolean;
      }
    ): PBXFile | null;
    removeFile(path: unknown, group: unknown, opt: unknown): unknown;
    getBuildProperty(prop: unknown, build: unknown): unknown;
    getBuildConfigByName(name: unknown): object;
    addDataModelDocument(filePath: unknown, group: unknown, opt: unknown): unknown;
    addTargetAttribute(prop: unknown, value: unknown, target: unknown): void;
    removeTargetAttribute(prop: unknown, target: unknown): void;
  }
}
