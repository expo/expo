// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

/// Durable store for fatal JavaScript errors.
///
/// A fatal error terminates the process moments after the `global.ErrorUtils` handler returns, so the
/// normal async (actor + SQLite) log path can race the shutdown and lose the record. Instead, the
/// fatal path writes the error to a small JSON file **synchronously** on the calling thread (no actor,
/// no database) before React Native tears the app down. On the next launch the pending files are
/// drained into the regular log pipeline as `exception` events. This mirrors how MetricKit delivers
/// crash diagnostics on the following launch.
enum PendingErrorStore {
  /// The single error captured at fatal time. Carries the owning session id and timestamp resolved at
  /// write time, since by drain time (next launch) the main session has rotated and "now" has moved on.
  struct PendingError: Codable {
    let source: String
    let type: String?
    let message: String
    let stacktrace: String?
    let componentStack: String?
    let sessionId: String
    let timestamp: String
  }

  /// Caps how many pending files are kept/ingested. A crash-on-launch loop could otherwise pile up
  /// files unbounded; we keep the newest `maxPendingErrors` and drop the rest (logged at drain time).
  static let maxPendingErrors = 5

  /// Writes a fatal error to disk synchronously. Best-effort: any failure is swallowed (we're on the
  /// way to a crash and must not throw out of the error handler).
  static func write(_ error: PendingError) {
    guard let directory = try? directoryUrl() else {
      return
    }
    write(error, in: directory)
  }

  /// Writes into an explicit directory. Tests use this overload to point at a temporary directory.
  static func write(_ error: PendingError, in directory: URL) {
    let fileName = "\(error.timestamp)-\(UUID().uuidString).json"
    let fileUrl = directory.appendingPathComponent(fileName)
    let encoder = JSONEncoder()
    guard let data = try? encoder.encode(error) else {
      return
    }
    // `.atomic` writes to a temp file and renames into place, so an interrupted process never leaves a
    // half-written file that drain would choke on.
    try? data.write(to: fileUrl, options: .atomic)
  }

  /// Reads all pending errors oldest-first and removes their files. Returns the decoded errors so the
  /// caller can ingest them into the database. Corrupt files are deleted and skipped.
  static func drain() -> [PendingError] {
    guard let directory = try? directoryUrl() else {
      return []
    }
    return drain(in: directory)
  }

  /// Drains from an explicit directory. Tests use this overload to point at a temporary directory.
  static func drain(in directory: URL) -> [PendingError] {
    guard
      let fileUrls = try? FileManager.default.contentsOfDirectory(
        at: directory,
        includingPropertiesForKeys: nil
      )
    else {
      return []
    }
    // File names are prefixed with an ISO-8601 timestamp, so lexicographic order is chronological.
    let jsonUrls = fileUrls.filter { $0.pathExtension == "json" }.sorted { $0.lastPathComponent < $1.lastPathComponent }
    let overflow = max(0, jsonUrls.count - maxPendingErrors)
    if overflow > 0 {
      logger.warn("[AppMetrics] Dropping \(overflow) pending error file(s) past the \(maxPendingErrors) cap.")
    }
    var errors: [PendingError] = []
    let decoder = JSONDecoder()
    for (index, fileUrl) in jsonUrls.enumerated() {
      // Delete every file we touch (including overflow and corrupt ones) so the directory can't grow
      // without bound.
      defer {
        try? FileManager.default.removeItem(at: fileUrl)
      }
      guard index >= overflow,
        let data = try? Data(contentsOf: fileUrl),
        let error = try? decoder.decode(PendingError.self, from: data)
      else {
        continue
      }
      errors.append(error)
    }
    return errors
  }

  /// The directory holding pending-error files, under the caches directory so they're not backed up.
  private static func directoryUrl() throws -> URL {
    let base = try FileManager.default.url(
      for: .cachesDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
    let directory = base.appendingPathComponent("ExpoAppMetrics/pending-errors")
    try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    return directory
  }
}
