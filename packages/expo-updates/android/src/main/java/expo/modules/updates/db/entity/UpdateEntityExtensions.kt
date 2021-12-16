package expo.modules.updates.db.entity

import expo.modules.manifests.core.Manifest

fun UpdateEntity.manifest() = manifestJson?.let { Manifest.fromManifestJson(it) }