package expo.modules.kotlin.modules

import expo.modules.kotlin.activityresult.AppContextActivityResultCaller
import expo.modules.kotlin.classcomponent.ClassDefinitionData
import expo.modules.kotlin.events.EventListener
import expo.modules.kotlin.events.EventName
import expo.modules.kotlin.objects.ObjectDefinitionData
import expo.modules.kotlin.views.ViewManagerDefinition

/**
 * Metadata for an optimized function registered via iOS-style DSL.
 */
data class OptimizedFunctionMetadata(
  val jsName: String,
  val kotlinMethodName: String,
  val jniSignature: String,
  val paramTypes: Array<String>,
  val returnType: String
) {
  override fun equals(other: Any?): Boolean {
    if (this === other) return true
    if (javaClass != other?.javaClass) return false

    other as OptimizedFunctionMetadata

    if (jsName != other.jsName) return false
    if (kotlinMethodName != other.kotlinMethodName) return false
    if (jniSignature != other.jniSignature) return false
    if (!paramTypes.contentEquals(other.paramTypes)) return false
    if (returnType != other.returnType) return false

    return true
  }

  override fun hashCode(): Int {
    var result = jsName.hashCode()
    result = 31 * result + kotlinMethodName.hashCode()
    result = 31 * result + jniSignature.hashCode()
    result = 31 * result + paramTypes.contentHashCode()
    result = 31 * result + returnType.hashCode()
    return result
  }
}

class ModuleDefinitionData(
  val name: String,
  val objectDefinition: ObjectDefinitionData,
  val viewManagerDefinitions: Map<String, ViewManagerDefinition> = emptyMap(),
  val eventListeners: Map<EventName, EventListener> = emptyMap(),
  val registerContracts: (suspend AppContextActivityResultCaller.() -> Unit)? = null,
  val classData: List<ClassDefinitionData> = emptyList(),
  val optimizedFunctions: List<OptimizedFunctionMetadata> = emptyList()
) {
  val constantsProvider = objectDefinition.legacyConstantsProvider
  val syncFunctions = objectDefinition.syncFunctions
  val asyncFunctions = objectDefinition.asyncFunctions
  val eventsDefinition = objectDefinition.eventsDefinition
  val properties = objectDefinition.properties
  val constants = objectDefinition.constants
  val functions = objectDefinition.functions
}
