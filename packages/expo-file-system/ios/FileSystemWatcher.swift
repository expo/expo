// Copyright 2024-present 650 Industries. All rights reserved.

import Darwin
import ExpoModulesCore
import Foundation

internal struct WatchOptions: Record {
  @Field var debounce: Int = 100
  @Field var events: [String]?
}

internal final class FileSystemWatcher: SharedObject {
  private static let eventQueueKey = DispatchSpecificKey<Void>()

  private let path: URL
  private let fileDescriptor: Int32
  private let debounceInterval: TimeInterval
  private let isWatchingDirectory: Bool
  private let eventQueue = DispatchQueue(label: "expo.filesystem.watcher")

  private var source: DispatchSourceFileSystemObject?
  private var debounceWorkItem: DispatchWorkItem?
  private var pendingEvents: DispatchSource.FileSystemEvent = []
  private var fileDescriptorClosed = false

  init(path: URL, options: WatchOptions?) throws {
    let standardizedPath = path.standardizedFileURL

    guard standardizedPath.isFileURL else {
      throw WatcherUnsupportedPathException(path.absoluteString)
    }

    var isDirectory: ObjCBool = false
    guard FileManager.default.fileExists(atPath: standardizedPath.path, isDirectory: &isDirectory) else {
      throw WatcherPathNotFoundException(standardizedPath.path)
    }

    guard FileManager.default.isReadableFile(atPath: standardizedPath.path) else {
      throw WatcherPermissionException(standardizedPath.path)
    }

    let descriptor = open(standardizedPath.path, O_EVTONLY)
    guard descriptor >= 0 else {
      throw WatcherSetupException(standardizedPath.path)
    }

    self.path = standardizedPath
    self.fileDescriptor = descriptor
    self.debounceInterval = TimeInterval(options?.debounce ?? 100) / 1000
    self.isWatchingDirectory = isDirectory.boolValue
    eventQueue.setSpecific(key: Self.eventQueueKey, value: ())
  }

  deinit {
    closeFileDescriptor()
  }

  func start() {
    withEventQueue {
      guard source == nil else {
        return
      }

      let source = DispatchSource.makeFileSystemObjectSource(
        fileDescriptor: fileDescriptor,
        eventMask: [.write, .delete, .rename, .extend],
        queue: eventQueue
      )

      source.setEventHandler { [weak self, weak source] in
        self?.handleEvent(flags: source?.data ?? [])
      }
      source.setCancelHandler { [weak self] in
        self?.closeFileDescriptor()
      }
      self.source = source
      source.activate()
    }
  }

  func stop() {
    withEventQueue {
      stopLocked()
    }
  }

  private func withEventQueue(_ block: () -> Void) {
    if DispatchQueue.getSpecific(key: Self.eventQueueKey) != nil {
      block()
    } else {
      eventQueue.sync(execute: block)
    }
  }

  private func stopLocked() {
    debounceWorkItem?.cancel()
    debounceWorkItem = nil
    pendingEvents = []
    let source = self.source
    self.source = nil
    source?.cancel()
  }

  private func handleEvent(flags: DispatchSource.FileSystemEvent) {
    if flags.contains(.delete) || flags.contains(.rename) {
      emitEvent(flags: flags)
      stopLocked()
      return
    }

    pendingEvents.formUnion(flags)
    debounceWorkItem?.cancel()

    let workItem = DispatchWorkItem { [weak self] in
      self?.flushPendingEvents()
    }

    debounceWorkItem = workItem
    eventQueue.asyncAfter(deadline: .now() + debounceInterval, execute: workItem)
  }

  private func flushPendingEvents() {
    guard !pendingEvents.isEmpty else {
      return
    }

    let flags = pendingEvents
    pendingEvents = []
    emitEvent(flags: flags)
  }

  private func emitEvent(flags: DispatchSource.FileSystemEvent) {
    for eventType in mapToUnifiedTypes(flags) {
      emit(
        event: "change",
        arguments: [
          "type": eventType,
          "path": path.absoluteString,
          "isDirectory": isWatchingDirectory,
          "nativeEventFlags": flags.rawValue,
        ]
      )
    }
  }

  private func mapToUnifiedTypes(_ flags: DispatchSource.FileSystemEvent) -> [String] {
    var types: [String] = []

    if flags.contains(.write) || flags.contains(.extend) {
      types.append("modified")
    }
    if flags.contains(.delete) {
      types.append("deleted")
    }
    if flags.contains(.rename) {
      types.append("renamed")
    }

    return types.isEmpty ? ["modified"] : types
  }

  private func closeFileDescriptor() {
    guard !fileDescriptorClosed else {
      return
    }
    fileDescriptorClosed = true
    close(fileDescriptor)
  }
}
