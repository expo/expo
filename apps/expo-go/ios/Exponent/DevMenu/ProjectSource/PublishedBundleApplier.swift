// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

/// Applies source edits to a published (plain-JS, Expo-Go-hosted) project.
///
/// Edits never touch the updates cache or the bundle's module text. Instead
/// the edited file is transpiled on device (OnDeviceTransformer), wrapped in
/// a factory whose `require` resolves import names to the module's existing
/// dependency ids, and injected by prepending a `__d` interceptor to a copy
/// of the bundle. The app loader launches the patched copy on the next
/// reload (PatchedBundleRegistry).
final class PublishedBundleApplier: @unchecked Sendable {
  struct SourceEdit {
    let displayPath: String
    let contents: String
    let originalContents: String
  }

  enum ApplyError: Error, LocalizedError {
    case moduleNotFound(String)
    case importsChanged(path: String, added: [String], removed: [String])
    case cannotVerify(path: String, detail: String)

    var errorDescription: String? {
      switch self {
      case .moduleNotFound(let path):
        return "Can't apply the edit to \(path): the file has no module in the published bundle (it may be type-only or unused). Edit a file that runs in the app."
      case .importsChanged(let path, let added, let removed):
        var parts: [String] = []
        if !added.isEmpty { parts.append("added \(added.joined(separator: ", "))") }
        if !removed.isEmpty { parts.append("removed \(removed.joined(separator: ", "))") }
        return "Can't apply the edit to \(path): it \(parts.joined(separator: " and ")). Published projects can't change a file's imports, so keep the import list as published."
      case .cannotVerify(let path, let detail):
        return "Can't safely edit \(path): \(detail). This file's transform can't be verified against the published bundle, so it stays read-only."
      }
    }
  }

  private let originalBundle: Data
  private let index: PublishedBundleIndex
  private let transformer: ModuleTransforming
  private let stateLock = NSLock()
  private var pristineResolutionByModuleId: [Int: [String: Int]] = [:]
  private var factoryCacheByPath: [String: (contents: String, result: (moduleId: Int, factory: String))] = [:]

  /// Heavy (bundle scan + sourcemap walk + payload evaluation); create off
  /// the main actor and keep for the session.
  init(bundleData: Data, transformer: ModuleTransforming) throws {
    self.originalBundle = BundlePatch.strippingExistingPatch(from: bundleData)
    let map = try BundleSourceMapProvider.extractInlineSourceMap(from: originalBundle)
    self.index = try PublishedBundleIndex.build(bundle: originalBundle, map: map)
    self.transformer = transformer
  }

  /// True when this display path maps to a module we can rebuild.
  func canApply(displayPath: String) -> Bool {
    index.moduleIdByDisplayPath[displayPath] != nil
  }

  struct EditFailure {
    let displayPath: String
    let error: Error
  }

  struct PrepareResult {
    let interceptor: String
    let failures: [EditFailure]
  }

  func prepare(edits: [SourceEdit]) -> PrepareResult {
    var factories: [(moduleId: Int, factory: String)] = []
    var failures: [EditFailure] = []
    for edit in edits {
      do {
        factories.append(try cachedFactory(for: edit))
      } catch {
        failures.append(EditFailure(displayPath: edit.displayPath, error: error))
      }
    }

    return PrepareResult(interceptor: BundlePatch.interceptor(overrides: factories), failures: failures)
  }

  // MARK: - factory generation

  private func cachedFactory(for edit: SourceEdit) throws -> (moduleId: Int, factory: String) {
    stateLock.lock()
    let cached = factoryCacheByPath[edit.displayPath]
    stateLock.unlock()
    if let cached, cached.contents == edit.contents {
      return cached.result
    }

    let result = try makeFactory(for: edit)

    stateLock.lock()
    factoryCacheByPath[edit.displayPath] = (edit.contents, result)
    stateLock.unlock()
    return result
  }

  private func makeFactory(for edit: SourceEdit) throws -> (moduleId: Int, factory: String) {
    guard let moduleId = index.moduleIdByDisplayPath[edit.displayPath],
          let module = index.modules[moduleId],
          let sourcePath = index.sourcePathByModuleId[moduleId] else {
      throw ApplyError.moduleNotFound(edit.displayPath)
    }

    let pristineIndexByName = try pristineResolution(
      moduleId: moduleId, module: module, sourcePath: sourcePath, edit: edit)

    let transformed = try transformer.transform(
      source: edit.contents,
      filename: sourcePath,
      moduleId: moduleId,
      dependencyIds: module.dependencyIds
    )

    let pristineNames = Set(pristineIndexByName.keys)
    let editedNames = Set(transformed.dependencyNames)
    guard editedNames == pristineNames else {
      throw ApplyError.importsChanged(
        path: edit.displayPath,
        added: editedNames.subtracting(pristineNames).sorted(),
        removed: pristineNames.subtracting(editedNames).sorted())
    }

    let factory = try BundlePatch.factory(
      moduleCode: transformed.moduleCode, indexByName: pristineIndexByName)
    return (moduleId: moduleId, factory: factory)
  }

  /// Resolves the PRISTINE source's require names onto the module's dep ids.
  /// This is the ground truth an edit is validated against; if the pristine
  /// file itself can't be transformed and resolved, edits to it are refused.
  private func pristineResolution(
    moduleId: Int, module: PublishedBundleIndex.Module, sourcePath: String, edit: SourceEdit
  ) throws -> [String: Int] {
    stateLock.lock()
    let cached = pristineResolutionByModuleId[moduleId]
    stateLock.unlock()
    if let cached {
      return cached
    }
    do {
      let pristine = try transformer.transform(
        source: edit.originalContents,
        filename: sourcePath,
        moduleId: moduleId,
        dependencyIds: module.dependencyIds
      )
      let resolution = try DependencyResolver.resolve(
        names: pristine.dependencyNames,
        dependencyIds: module.dependencyIds,
        sourcePathsById: index.sourcePathByModuleId,
        moduleSourcePath: sourcePath
      )
      stateLock.lock()
      pristineResolutionByModuleId[moduleId] = resolution
      stateLock.unlock()
      return resolution
    } catch let error as DependencyResolver.ResolutionError {
      throw ApplyError.cannotVerify(path: edit.displayPath, detail: detailText(for: error))
    }
  }

  private func detailText(for error: DependencyResolver.ResolutionError) -> String {
    switch error {
    case .countMismatch(let found, let expected):
      return "the unmodified file transforms to \(found) imports but the published module has \(expected)"
    case .unresolvable(let name):
      return "the import '\(name)' can't be matched to a published dependency"
    case .ambiguous(let names):
      return "the imports \(names.joined(separator: ", ")) can't be matched unambiguously"
    }
  }
}
