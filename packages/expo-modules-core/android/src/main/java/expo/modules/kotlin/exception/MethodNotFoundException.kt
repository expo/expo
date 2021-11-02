package expo.modules.kotlin.exception

internal class MethodNotFoundException(methodName: String, moduleName: String)
  : CodedException(message = "Cannot fund method $methodName in module $moduleName")
