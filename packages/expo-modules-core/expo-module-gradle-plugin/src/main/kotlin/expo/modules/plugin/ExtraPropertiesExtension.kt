// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.plugin

import org.gradle.api.plugins.ExtraPropertiesExtension

internal inline fun <reified T> ExtraPropertiesExtension.safeGet(name: String): T? {
  return if (has(name)) {
    get(name) as? T
  } else {
    null
  }
}
