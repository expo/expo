// Copyright 2015-present 650 Industries. All rights reserved.

import Testing

@testable import EXManifests

@Suite("getPluginProperties")
struct ManifestTests {
  @Test
  func `should return nil when plugin is not matched`() {
    var manifestJson: [String: Any] = [:]
    var manifest = ManifestFactory.manifest(forManifestJSON: manifestJson)
    #expect(manifest.getPluginProperties(packageName: "test") == nil)

    manifestJson = ["plugins": [] as [Any]]
    manifest = ManifestFactory.manifest(forManifestJSON: manifestJson)
    #expect(manifest.getPluginProperties(packageName: "test") == nil)

    manifestJson = ["plugins": ["hello"]]
    manifest = ManifestFactory.manifest(forManifestJSON: manifestJson)
    #expect(manifest.getPluginProperties(packageName: "test") == nil)
  }

  @Test
  func `should return nil when the matched plugin has no properties`() {
    let manifestJson = ["plugins": ["test"]]
    let manifest = ManifestFactory.manifest(forManifestJSON: manifestJson)
    #expect(manifest.getPluginProperties(packageName: "test") == nil)
  }

  @Test
  func `should return matched plugin properties`() {
    let manifestJson = ["plugins": [["test", ["foo": "bar"]] as [Any]]]
    let manifest = ManifestFactory.manifest(forManifestJSON: manifestJson)
    let props = manifest.getPluginProperties(packageName: "test")
    #expect(props as? [String: String] == ["foo": "bar"])
  }

  @Test
  func `should not crash with array with name and no props`() {
    let manifestJson = ["plugins": [["test"]]]
    let manifest = ManifestFactory.manifest(forManifestJSON: manifestJson)
    #expect(manifest.getPluginProperties(packageName: "test") == nil)
  }
}
