// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

/// Generates and applies unified diffs in the exact output format of the
/// `diff` npm package's createPatch, which the snack runtime parses
/// byte-for-byte (tabs after the ---/+++ headers, -1,0 hunk start for an
/// empty old file).
enum SnackDiff {
  static func generateUnifiedDiff(oldContents: String, newContents: String) -> String {
    if newContents.isEmpty {
      return ""
    }

    // Split content into lines, preserving knowledge of trailing newline
    let hasTrailingNewline = newContents.hasSuffix("\n")
    var newLines = newContents.components(separatedBy: "\n")

    // Remove empty last element if content ends with newline
    if hasTrailingNewline && newLines.last == "" {
      newLines.removeLast()
    }

    let newCount = newLines.count

    // Format matching the 'diff' npm package's createPatch output exactly
    // Note: tabs after "--- code" and "+++ code", and -1,0 not -0,0
    var diff = "Index: code\n"
    diff += "===================================================================\n"
    diff += "--- code\t\n"
    diff += "+++ code\t\n"

    // Hunk header: @@ -1,0 +1,newCount @@ (diff package uses -1,0 for empty old file)
    diff += "@@ -1,0 +1,\(newCount) @@\n"

    // Add all new lines
    for line in newLines {
      diff += "+\(line)\n"
    }

    // Add "no newline" marker if content doesn't end with newline
    if !hasTrailingNewline {
      diff += "\\ No newline at end of file\n"
    }

    return diff
  }

  static func apply(_ patch: String, to base: String) -> String {
    // If patch is empty, return base as-is
    if patch.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
      return base
    }

    // Parse the unified diff format
    let patchLines = patch.components(separatedBy: "\n")
    let baseLines = base.components(separatedBy: "\n")
    var result: [String] = []

    // Track current position in base and patch
    var patchIndex = 0

    // Skip diff header lines (--- and +++)
    while patchIndex < patchLines.count {
      let line = patchLines[patchIndex]
      if line.hasPrefix("@@") {
        break
      }
      patchIndex += 1
    }

    // For empty base (new file), extract all added lines
    if base.isEmpty {
      var addedLines: [String] = []
      for i in patchIndex..<patchLines.count {
        let line = patchLines[i]
        if line.hasPrefix("+") && !line.hasPrefix("+++") {
          addedLines.append(String(line.dropFirst()))
        } else if line.hasPrefix("@@") || line.hasPrefix("-") || line.hasPrefix("\\") {
          // Skip hunk headers, removed lines, and "no newline" markers
          continue
        } else if !line.isEmpty {
          // Context line (shouldn't exist for empty base, but handle it)
          addedLines.append(line)
        }
      }

      // If we got no results, the patch might just be raw content
      if addedLines.isEmpty && !patch.isEmpty {
        return patch
      }

      // Remove trailing newline that diff package adds
      let joined = addedLines.joined(separator: "\n")
      if joined.hasPrefix("\n") {
        return String(joined.dropFirst())
      }
      return joined
    }

    // For non-empty base, apply hunks
    var baseLineIndex = 0

    while patchIndex < patchLines.count {
      let line = patchLines[patchIndex]

      if line.hasPrefix("@@") {
        // Parse hunk header: @@ -start,count +start,count @@
        // Format: @@ -oldStart,oldCount +newStart,newCount @@
        let regex = try? NSRegularExpression(pattern: "@@ -(\\d+)(?:,(\\d+))? \\+(\\d+)(?:,(\\d+))? @@")
        if let match = regex?.firstMatch(in: line, range: NSRange(line.startIndex..., in: line)),
           let oldStartRange = Range(match.range(at: 1), in: line),
           let oldStartValue = Int(line[oldStartRange]) {
          let oldStart = oldStartValue - 1 // 0-indexed

          // Copy any lines before this hunk
          while baseLineIndex < oldStart && baseLineIndex < baseLines.count {
            result.append(baseLines[baseLineIndex])
            baseLineIndex += 1
          }
        }
        patchIndex += 1
        continue
      }

      if line.hasPrefix("-") && !line.hasPrefix("---") {
        // Removed line - skip it in base
        baseLineIndex += 1
        patchIndex += 1
      } else if line.hasPrefix("+") && !line.hasPrefix("+++") {
        // Added line - add to result
        result.append(String(line.dropFirst()))
        patchIndex += 1
      } else if line.hasPrefix("\\") {
        // "\ No newline at end of file" - skip
        patchIndex += 1
      } else if line.hasPrefix(" ") || (!line.hasPrefix("-") && !line.hasPrefix("+") && !line.hasPrefix("@")) {
        // Context line - copy from base
        if baseLineIndex < baseLines.count {
          result.append(baseLines[baseLineIndex])
          baseLineIndex += 1
        }
        patchIndex += 1
      } else {
        patchIndex += 1
      }
    }

    // Copy remaining lines from base
    while baseLineIndex < baseLines.count {
      result.append(baseLines[baseLineIndex])
      baseLineIndex += 1
    }

    return result.joined(separator: "\n")
  }
}
