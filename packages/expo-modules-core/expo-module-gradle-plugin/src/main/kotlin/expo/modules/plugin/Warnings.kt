package expo.modules.plugin

import org.slf4j.Logger

private val notDefinedKeys = mutableSetOf<String>()

fun <T> Logger.warnIfNotDefined(name: String, defaultValue: T): T = synchronized(notDefinedKeys) {
  if (!notDefinedKeys.contains(name)) {
    notDefinedKeys.add(name)
    warn("Property '$name' is not defined. Using default value: '$defaultValue'. Please ensure the 'expo-root-project' plugin is applied to your root project.")
  }
  return defaultValue
}
