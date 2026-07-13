// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

/// Matches a transpiled module's require names onto the published module's
/// existing dependency ids, using only the sourcemap paths of those ids.
/// Refusal (throwing) is the safety valve: a name that can't be matched
/// unambiguously means the edit can't be linked into the frozen graph.
enum DependencyResolver {
  enum ResolutionError: Error, Equatable {
    case countMismatch(found: Int, expected: Int)
    case unresolvable(name: String)
    case ambiguous(names: [String])
  }

  private static let extensions = ["", ".ts", ".tsx", ".js", ".jsx", ".json"]
  private static let platforms = ["", ".ios", ".native"]

  /// Returns each name's first index into the ORIGINAL (possibly
  /// id-duplicated) dependency array.
  static func resolve(
    names: [String],
    dependencyIds: [Int],
    sourcePathsById: [Int: String],
    moduleSourcePath: String
  ) throws -> [String: Int] {
    var uniqueIds: [Int] = []
    var seen = Set<Int>()
    for id in dependencyIds where !seen.contains(id) {
      seen.insert(id)
      uniqueIds.append(id)
    }

    guard names.count == uniqueIds.count else {
      throw ResolutionError.countMismatch(found: names.count, expected: uniqueIds.count)
    }

    let moduleDir = directory(of: moduleSourcePath)
    let depSources = uniqueIds.map { ($0, sourcePathsById[$0]) }

    var candidates: [String: Set<Int>] = [:]
    for name in names {
      let ids = candidateIds(for: name, moduleDir: moduleDir, depSources: depSources)
      guard !ids.isEmpty else {
        throw ResolutionError.unresolvable(name: name)
      }
      candidates[name] = Set(ids)
    }

    var assigned: [String: Int] = [:]
    var progress = true
    while progress && assigned.count < names.count {
      progress = false
      for name in names where assigned[name] == nil {
        guard let cands = candidates[name] else { continue }
        if cands.isEmpty {
          throw ResolutionError.unresolvable(name: name)
        }
        if cands.count == 1, let id = cands.first {
          assigned[name] = id
          for other in names where other != name {
            candidates[other]?.remove(id)
          }
          progress = true
        }
      }
    }

    guard assigned.count == names.count else {
      throw ResolutionError.ambiguous(names: names.filter { assigned[$0] == nil })
    }

    var result: [String: Int] = [:]
    for (name, id) in assigned {
      result[name] = dependencyIds.firstIndex(of: id)
    }
    return result
  }

  private static func candidateIds(
    for name: String, moduleDir: String, depSources: [(Int, String?)]
  ) -> [Int] {
    var hits: [Int] = []

    if name.hasPrefix(".") {
      let stem = lexicallyResolved(base: moduleDir, relative: name)
      var candidatePaths = Set<String>()
      for platform in platforms {
        for ext in extensions {
          candidatePaths.insert(stem + platform + ext)
          candidatePaths.insert(stem + "/index" + platform + ext)
        }
      }
      for (id, source) in depSources {
        if let source, candidatePaths.contains(source) {
          hits.append(id)
        }
      }
      return hits
    }

    let parts = name.split(separator: "/").map(String.init)
    let isScoped = name.hasPrefix("@")
    let package = isScoped ? parts.prefix(2).joined(separator: "/") : parts[0]
    let subpath = Array(isScoped ? parts.dropFirst(2) : parts.dropFirst())

    // directory names a package may live under: node_modules/<pkg> plus
    // monorepo layouts that drop or fold the scope
    // (@expo/html-elements -> packages/html-elements, @expo/ui -> packages/expo-ui)
    var dirNames = [package]
    if isScoped, parts.count >= 2 {
      let scope = String(parts[0].dropFirst())
      dirNames.append(parts[1])
      dirNames.append("\(scope)-\(parts[1])")
    }

    for (id, source) in depSources {
      guard let source else { continue }
      for dir in dirNames {
        guard let range = source.range(of: "/\(dir)/") else { continue }
        let remainder = String(source[range.upperBound...])
        if subpath.isEmpty || subpath.allSatisfy({ remainder.contains($0) }) {
          hits.append(id)
        }
        break
      }
    }

    if hits.isEmpty {
      // bare alias fallback (e.g. ThemeProvider via tsconfig paths)
      for (id, source) in depSources {
        guard let source else { continue }
        var base = (source as NSString).lastPathComponent
        while let dot = base.lastIndex(of: ".") {
          base = String(base[..<dot])
        }
        if base == name {
          hits.append(id)
        }
      }
    }
    return hits
  }

  private static func directory(of path: String) -> String {
    guard let slash = path.lastIndex(of: "/") else { return "/" }
    return String(path[..<slash])
  }

  private static func lexicallyResolved(base: String, relative: String) -> String {
    var parts = base.split(separator: "/").map(String.init)
    for component in relative.split(separator: "/") {
      switch component {
      case ".":
        continue
      case "..":
        if !parts.isEmpty { parts.removeLast() }
      default:
        parts.append(String(component))
      }
    }
    return "/" + parts.joined(separator: "/")
  }
}
