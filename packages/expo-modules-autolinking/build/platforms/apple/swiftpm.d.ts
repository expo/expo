import type { ModuleDescriptorIos, PackageRevision } from '../../types';
/**
 * SwiftPM-mode counterpart of the CocoaPods resolver in `apple.ts`. Builds a
 * `ModuleDescriptorIos` with the `swiftPackage` field populated and `pods`
 * left empty. Modules without a `Package.swift` are skipped so SwiftPM
 * adoption can roll out one package at a time.
 */
export declare function resolveSwiftPackageModuleAsync(packageName: string, revision: PackageRevision): Promise<ModuleDescriptorIos | null>;
