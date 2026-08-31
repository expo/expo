// Copyright 2026-present 650 Industries. All rights reserved.

import Foundation
import Testing

@testable import ExpoModulesCore

/**
 Counts how many times `CountedValue` was decoded, so a test can tell an actual decode from a
 skipped one.
 */
private enum DecodeCounter {
  nonisolated(unsafe) static var decodes = 0
}

private struct CountedValue: Convertible {
  let text: String

  static func convert(from value: Any?, appContext: AppContext) throws -> CountedValue {
    DecodeCounter.decodes += 1
    return CountedValue(text: (value as? String) ?? "")
  }
}

private final class TestViewProps: ExpoSwiftUI.ViewProps {
  @Field var modifiers: [[String: Any]]?
  @Field var counted: CountedValue?
  @Field var title: String?

  required init() {
    super.init()
  }

  required init(rawProps: [String: Any], context: AppContext) throws {
    try super.init(rawProps: rawProps, context: context)
  }
}

// The Objective-C reference types are the point here: these are the values Fabric delivers.
// swiftlint:disable legacy_objc_type

/**
 Builds a props map the way `ExpoFabricViewObjC.finalizeUpdates` does — Foundation objects out of
 `convertFollyDynamicToId`, freshly allocated on every update, so no value carries its identity
 over from the previous update.
 */
private func makeRawProps(opacity: Double = 0.5, title: String = "hello") -> [String: Any] {
  let modifiers: NSArray = [
    ["$type": "padding", "all": 8] as NSDictionary,
    ["$type": "opacity", "opacity": opacity] as NSDictionary
  ]
  return [
    "modifiers": modifiers,
    "counted": "counted" as NSString,
    "title": title as NSString
  ]
}
// swiftlint:enable legacy_objc_type

/**
 Returns the address of the array's element storage. Two arrays that share storage report the same
 address, which is what lets SwiftUI treat a value read out of the props as unchanged.
 */
private func elementStorage(of array: [[String: Any]]?) -> UnsafeRawPointer? {
  guard let array else {
    return nil
  }
  return array.withUnsafeBufferPointer { UnsafeRawPointer($0.baseAddress) }
}

@Suite("ExpoSwiftUI.ViewProps")
struct SwiftUIViewPropsTests {
  let appContext = AppContext.create()

  @Test
  func `decodes every field on the first update`() throws {
    let props = TestViewProps()
    DecodeCounter.decodes = 0

    try props.updateRawProps(makeRawProps(), appContext: appContext)

    #expect(DecodeCounter.decodes == 1)
    #expect(props.modifiers?.count == 2)
    #expect(props.title == "hello")
  }

  @Test
  func `skips decoding a field whose raw value is unchanged`() throws {
    let props = TestViewProps()
    try props.updateRawProps(makeRawProps(), appContext: appContext)
    DecodeCounter.decodes = 0

    // Only `title` changes. The other fields carry equal content in freshly allocated objects.
    try props.updateRawProps(makeRawProps(title: "world"), appContext: appContext)

    #expect(DecodeCounter.decodes == 0)
    #expect(props.title == "world")
  }

  @Test
  func `keeps the decoded value's identity when its raw value is unchanged`() throws {
    let props = TestViewProps()
    try props.updateRawProps(makeRawProps(), appContext: appContext)

    // Holding the array keeps its storage alive, so a matching address can't be a reused allocation.
    let firstModifiers = props.modifiers
    let storageBeforeUpdate = elementStorage(of: firstModifiers)
    #expect(storageBeforeUpdate != nil)

    try props.updateRawProps(makeRawProps(title: "world"), appContext: appContext)

    #expect(elementStorage(of: props.modifiers) == storageBeforeUpdate)
  }

  @Test
  func `decodes a field again when its raw value changes`() throws {
    let props = TestViewProps()
    try props.updateRawProps(makeRawProps(), appContext: appContext)

    let firstModifiers = props.modifiers
    let storageBeforeUpdate = elementStorage(of: firstModifiers)

    try props.updateRawProps(makeRawProps(opacity: 0.9), appContext: appContext)

    #expect(elementStorage(of: props.modifiers) != storageBeforeUpdate)
    #expect((props.modifiers?[1]["opacity"] as? NSNumber)?.doubleValue == 0.9)
  }

  @Test
  func `leaves a field alone while its key is missing from the props map`() throws {
    let props = TestViewProps()
    try props.updateRawProps(makeRawProps(), appContext: appContext)
    DecodeCounter.decodes = 0

    var withoutCounted = makeRawProps(title: "world")
    withoutCounted.removeValue(forKey: "counted")
    try props.updateRawProps(withoutCounted, appContext: appContext)

    // Nothing resets a field whose key is absent, so it keeps the value it already holds and needs
    // no decode — the same as when the key is present with an unchanged value.
    #expect(DecodeCounter.decodes == 0)
    #expect(props.counted?.text == "counted")
  }

  @Test
  func `decodes a field again when its raw value changes back and forth`() throws {
    let props = TestViewProps()
    try props.updateRawProps(makeRawProps(opacity: 0.5), appContext: appContext)
    try props.updateRawProps(makeRawProps(opacity: 0.9), appContext: appContext)

    let storageBeforeUpdate = elementStorage(of: props.modifiers)
    try props.updateRawProps(makeRawProps(opacity: 0.5), appContext: appContext)

    #expect(elementStorage(of: props.modifiers) != storageBeforeUpdate)
    #expect((props.modifiers?[1]["opacity"] as? NSNumber)?.doubleValue == 0.5)
  }
}
