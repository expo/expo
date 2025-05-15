package expo.modules.kotlin.views

import com.facebook.react.bridge.Arguments
import com.facebook.react.uimanager.ReactStylesDiffMap
import expo.modules.kotlin.exception.NullArgumentException
import expo.modules.kotlin.types.putGeneric

fun getFilteredReactStylesDiffMap(
  map: ReactStylesDiffMap?,
  filteredKeys: List<String>
) : ReactStylesDiffMap {
  val inputMap = map ?: throw NullArgumentException()
  val filteredKeySet = filteredKeys.toSet()
  val inputKeySet = inputMap.toMap().keys

  // if the keys are equal, return the input map - no need to perform the copy operation.
  if (inputKeySet == filteredKeySet) {
    return inputMap
  }

  val resultMap = Arguments.createMap()
  val iterator = inputMap.toMap().iterator()

  while (iterator.hasNext()) {
    val (key, value) = iterator.next()
    if (key !in filteredKeySet) {
      when (value) {
        is HashMap<*, *> -> resultMap.putMap(key, inputMap.getMap(key))
        is ArrayList<*> -> resultMap.putArray(key, inputMap.getArray(key))
        else -> resultMap.putGeneric(key, value)
      }
    }
  }

  return ReactStylesDiffMap(resultMap)
}
