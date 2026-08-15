/**
 * Result of a verification check
 */
export interface XCFrameworkVerificationResult {
  success: boolean;
  message: string;
  details?: string;
}

/**
 * Slice information extracted from xcframework
 */
export interface XCFrameworkSlice {
  sliceId: string;
  frameworkName: string;
  frameworkPath: string;
  binaryPath: string;
  sdkName: string;
}

/**
 * Complete verification report for an xcframework
 */
export interface XCFrameworkVerificationReport {
  xcframeworkPath: string;
  infoPlistValid: XCFrameworkVerificationResult;
  codesignValid: XCFrameworkVerificationResult;
  junkFiles: string[];
  slices: XCFrameworkSliceVerificationReport[];
  overallSuccess: boolean;
}

/**
 * Verification report for a single slice
 */
export interface XCFrameworkSliceVerificationReport {
  sliceId: string;
  frameworkName: string;
  /** True if the framework contains only ObjC/C++ code (no Swift modules) */
  isObjCOnly: boolean;
  machoInfo: XCFrameworkVerificationResult;
  linkedDeps: string[];
  headersPresent: XCFrameworkVerificationResult;
  modulesPresent: XCFrameworkVerificationResult;
  moduleMapPresent: XCFrameworkVerificationResult;
  modularHeadersValid: XCFrameworkVerificationResult;
  clangModuleImport: XCFrameworkVerificationResult;
  swiftInterfaceTypecheck: XCFrameworkVerificationResult;
  /** Whether a matching dSYM bundle exists for this slice */
  dsymPresent: XCFrameworkVerificationResult;
  /** Whether dSYM UUIDs match the framework binary UUIDs */
  dsymUuidMatch: XCFrameworkVerificationResult;
  /** Whether DWARF source paths use the canonical /expo-src/ prefix (no absolute CI paths) */
  dsymDebugPrefixMapping: XCFrameworkVerificationResult;
}

/**
 * Options for verification
 */
export interface XCFrameworkVerifyOptions {
  /** Skip codesign verification */
  skipCodesign?: boolean;
  /** Skip clang module import check */
  skipClangCheck?: boolean;
  /** Skip swift interface typecheck */
  skipSwiftCheck?: boolean;
  /** Skip dSYM verification (presence, UUID match, debug prefix mapping) */
  skipDsymCheck?: boolean;
  /** Show detailed error messages */
  verbose?: boolean;
}
