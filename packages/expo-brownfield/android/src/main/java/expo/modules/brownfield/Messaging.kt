package expo.modules.brownfield

import java.util.UUID

typealias BrownfieldMessage = Map<String, Any?>

typealias BrownfieldCallback = (BrownfieldMessage) -> Unit

object BrownfieldMessaging {
  data class BrownfieldListener(val id: String, val callback: BrownfieldCallback)

  private val listeners = mutableSetOf<BrownfieldListener>()
  private var expoModule: ExpoBrownfieldModule? = null

  fun addListener(callback: BrownfieldCallback): String {
    val id = java.util.UUID.randomUUID().toString()
    listeners.add(BrownfieldListener(id, callback))

    return id
  }

  fun removeListener(id: String) {
    listeners.removeAll { it.id == id }
  }

  fun sendMessage(message: BrownfieldMessage) {
    expoModule?.let { module -> module.sendMessage(message) }
  }

  internal fun emit(message: BrownfieldMessage) {
    listeners.forEach { listener -> listener.callback(message) }
  }

  internal fun setExpoModule(expoModule: ExpoBrownfieldModule?) {
    this.expoModule = expoModule
  }
}
