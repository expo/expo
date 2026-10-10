// Copyright 2025-present 650 Industries. All rights reserved.

/// Renders a MetricKit-shaped `CallStackTree` into the flat stack trace string attached to log
/// events. Shared by crash reports, hang reports and startup stall reports so they all read the
/// same way and symbolicate with the same tooling.
extension CrashReport.CallStackTree {
  struct RenderedStack {
    /// `nil` when the tree held no frames.
    let stacktrace: String?
    let renderedFrameCount: Int
    let totalFrameCount: Int
    /// `<binary>:<uuid>` entries for the binaries named in the trace, or `nil` when none carried a UUID.
    let binaryUUIDs: [String]?
  }

  /// Renders the frames of the attributed thread(s) — or of every thread when none is attributed —
  /// outermost first. Collection stops at `maxFrames`; a trailing line says how many were cut.
  func render(maxFrames: Int, maxLength: Int) -> RenderedStack? {
    guard let callStacks else {
      return nil
    }
    let attributedStacks = callStacks.filter { $0.threadAttributed == true }
    let selectedStacks = attributedStacks.isEmpty ? callStacks : attributedStacks
    var frames: [Frame] = []
    var totalFrames = 0
    for callStack in selectedStacks {
      Self.collectFrames(callStack.callStackRootFrames ?? [], into: &frames, total: &totalFrames, maxFrames: maxFrames)
    }
    var lines = frames.map(Self.renderFrame)
    if totalFrames > frames.count {
      lines.append("… +\(totalFrames - frames.count) more frames")
    }
    let stacktrace: String? = lines.isEmpty
      ? nil
      : truncateToMaxLength(
        lines.joined(separator: "\n"),
        maxLength: maxLength,
        warningMessage: "[AppMetrics] Native stack trace exceeded the maximum length and was truncated."
      )
    return RenderedStack(
      stacktrace: stacktrace,
      renderedFrameCount: frames.count,
      totalFrameCount: totalFrames,
      binaryUUIDs: Self.binaryUUIDs(in: frames)
    )
  }

  /// Builds a single-thread tree from return addresses captured in this process, innermost first.
  /// Each address is attributed to its binary with `dladdr` so the result symbolicates exactly like
  /// a MetricKit tree (`CrashReportSymbolicator`) and can be re-symbolicated off-device.
  static func fromAddresses(_ addresses: [UInt64], threadAttributed: Bool = true) -> CrashReport.CallStackTree {
    var uuidCache: [UInt64: String?] = [:]
    // Outermost frame is the root, matching MetricKit's shape, so build from the innermost up.
    var leaf: Frame?
    var subFrame: Frame?
    for address in addresses {
      var info = Dl_info()
      var binaryName: String?
      var binaryUUID: String?
      var offset: UInt64?
      if dladdr(UnsafeRawPointer(bitPattern: UInt(address)), &info) != 0, let base = info.dli_fbase {
        let baseAddress = UInt64(UInt(bitPattern: base))
        if let namePtr = info.dli_fname {
          let path = String(cString: namePtr)
          binaryName = path.split(separator: "/").last.map(String.init) ?? path
        }
        if address >= baseAddress {
          offset = address - baseAddress
        }
        if let cached = uuidCache[baseAddress] {
          binaryUUID = cached
        } else {
          let uuid = MachOImage.uuid(ofImageAt: base)
          uuidCache[baseAddress] = uuid
          binaryUUID = uuid
        }
      }
      // Innermost first: the frame built so far is *deeper* than this one, so it becomes the child.
      subFrame = Frame(
        binaryName: binaryName,
        binaryUUID: binaryUUID,
        address: address,
        offsetIntoBinaryTextSegment: offset,
        sampleCount: 1,
        subFrames: subFrame.map { [$0] },
        symbol: nil
      )
      leaf = subFrame
    }
    let stack = CallStack(threadAttributed: threadAttributed, callStackRootFrames: leaf.map { [$0] })
    return CrashReport.CallStackTree(callStacks: [stack])
  }

  private static func collectFrames(
    _ source: [Frame],
    into frames: inout [Frame],
    total: inout Int,
    maxFrames: Int
  ) {
    for frame in source {
      total += 1
      if frames.count < maxFrames {
        frames.append(frame)
      }
      collectFrames(frame.subFrames ?? [], into: &frames, total: &total, maxFrames: maxFrames)
    }
  }

  /// The binaries named in the trace and their UUIDs, as `<binary>:<uuid>` entries.
  ///
  /// An offset only means something against the build it came from, so these say which dSYM to
  /// reach for.
  private static func binaryUUIDs(in frames: [Frame]) -> [String]? {
    var uuidsByBinary: [String: String] = [:]
    for frame in frames {
      guard let binaryName = frame.binaryName, let binaryUUID = frame.binaryUUID else {
        continue
      }
      uuidsByBinary[binaryName] = binaryUUID
    }
    guard !uuidsByBinary.isEmpty else {
      return nil
    }
    return uuidsByBinary.sorted { $0.key < $1.key }.map { "\($0.key):\($0.value)" }
  }

  /// Renders one frame as `<symbol> (<binary> + <offset>)`.
  ///
  /// We keep the address even when a symbol resolved, because on a stripped binary it can be the
  /// wrong one, and it's what lets you re-symbolicate from the archive. Without an offset or an
  /// address there's nothing to look up, so the binary name alone is left off.
  private static func renderFrame(_ frame: Frame) -> String {
    let location: String? = {
      if let binaryName = frame.binaryName, let offset = frame.offsetIntoBinaryTextSegment {
        return "\(binaryName) + \(offset)"
      }
      if let address = frame.address {
        return "0x\(String(address, radix: 16))"
      }
      return nil
    }()
    switch (frame.symbol, location) {
    case (let symbol?, let location?):
      return "\(symbol) (\(location))"
    case (let symbol?, nil):
      return symbol
    case (nil, let location?):
      return location
    case (nil, nil):
      return frame.binaryName ?? "<unknown>"
    }
  }
}

import MachO

enum MachOImage {
  /// The `LC_UUID` of the Mach-O image whose header is at `base`, or `nil` for anything that
  /// doesn't look like a 64-bit header or carries no UUID.
  static func uuid(ofImageAt base: UnsafeRawPointer) -> String? {
    let header = base.assumingMemoryBound(to: mach_header_64.self)
    guard header.pointee.magic == MH_MAGIC_64 else {
      return nil
    }
    var cursor = base + MemoryLayout<mach_header_64>.size
    for _ in 0..<Int(header.pointee.ncmds) {
      let command = cursor.assumingMemoryBound(to: load_command.self)
      if command.pointee.cmd == UInt32(LC_UUID) {
        let uuidCommand = cursor.assumingMemoryBound(to: uuid_command.self)
        return UUID(uuid: uuidCommand.pointee.uuid).uuidString
      }
      guard command.pointee.cmdsize > 0 else {
        return nil
      }
      cursor += Int(command.pointee.cmdsize)
    }
    return nil
  }
}
