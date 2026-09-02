// Copyright 2025-present 650 Industries. All rights reserved.

/// A composition of `JavaScriptDecodable` and `JavaScriptEncodable` for types that convert in
/// both directions between JavaScript and native.
///
/// This is a type alias rather than an inheriting protocol so that satisfying both halves is
/// enough to satisfy it — no extra conformance declaration — and so that decode-only or
/// encode-only types are never required to implement the other side.
public typealias JavaScriptCodable = JavaScriptDecodable & JavaScriptEncodable
