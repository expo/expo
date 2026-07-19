package host.exp.exponent.storage

import expo.modules.manifests.core.Manifest

data class ExponentDBObject(
  var manifestUrl: String,
  var manifest: Manifest,
  var bundleUrl: String
)
