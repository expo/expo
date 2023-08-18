package expo.modules.keepawake

import expo.modules.kotlin.exception.CodedException

internal class ActivateKeepAwakeException :
  CodedException("Unable to activate keep awake")

internal class DeactivateKeepAwakeException :
  CodedException("Unable to deactivate keep awake. However, it probably is deactivated already")

internal class MissingModuleException(moduleName: String) :
  CodedException("Module '$moduleName' not found. Are you sure all modules are linked correctly?")
