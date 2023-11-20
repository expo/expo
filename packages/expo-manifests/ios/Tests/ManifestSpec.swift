// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesTestCore

@testable import EXManifests

final class ManifestSpec: ExpoSpec {
  override class func spec() {
    describe("getPluginProperties") {
      it("should return nil when plugin is not matched") {
        var manifestJson: [String: Any] = [:]
        var manifest = ManifestFactory.manifest(forManifestJSON: manifestJson)
        expect(manifest.getPluginProperties(packageName: "test")).to(beNil())

        manifestJson = ["plugins": [] as [Any]]
        manifest = ManifestFactory.manifest(forManifestJSON: manifestJson)
        expect(manifest.getPluginProperties(packageName: "test")).to(beNil())

        manifestJson = ["plugins": ["hello"]]
        manifest = ManifestFactory.manifest(forManifestJSON: manifestJson)
        expect(manifest.getPluginProperties(packageName: "test")).to(beNil())
      }

      it("should return nil when the matched plugin has no properties") {
        let manifestJson = ["plugins": ["test"]]
        let manifest = ManifestFactory.manifest(forManifestJSON: manifestJson)
        expect(manifest.getPluginProperties(packageName: "test")).to(beNil())
      }

      it("should return matched plugin properties") {
        let manifestJson = ["plugins": [["test", ["foo": "bar"]] as [Any]]]
        let manifest = ManifestFactory.manifest(forManifestJSON: manifestJson)
        let props = manifest.getPluginProperties(packageName: "test")
        expect(props as? [String: String]) == ["foo": "bar"]
      }

      it("should not crash with array with name and no props") {
        let manifestJson = ["plugins": [["test"]]]
        let manifest = ManifestFactory.manifest(forManifestJSON: manifestJson)
        expect(manifest.getPluginProperties(packageName: "test")).to(beNil())
      }
    }
  }
}
