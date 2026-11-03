// Copyright 2026-present 650 Industries. All rights reserved.

import Testing
import UIKit

@testable import ExpoModulesCore

private final class PrivateView: UIView {}

private enum Namespace {
  struct Nested {}
}

private struct Generic<T> {}

@Suite("unqualifiedTypeName")
struct TypeNameTests {
  @Test
  func `matches String(describing:) for private, nested and generic types`() {
    #expect(unqualifiedTypeName(PrivateView.self) == String(describing: PrivateView.self))
    #expect(unqualifiedTypeName(Namespace.Nested.self) == String(describing: Namespace.Nested.self))
    #expect(unqualifiedTypeName(Generic<Int>.self) == String(describing: Generic<Int>.self))
  }

  @Test
  func `drops the file discriminator of a private type`() {
    #expect(unqualifiedTypeName(PrivateView.self) == "PrivateView")
  }
}
