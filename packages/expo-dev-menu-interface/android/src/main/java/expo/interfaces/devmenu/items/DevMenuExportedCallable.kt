package expo.interfaces.devmenu.items

import com.facebook.react.bridge.ReadableMap

interface DevMenuCallableProvider {
  fun registerCallable(): DevMenuExportedCallable?
}

sealed class DevMenuExportedCallable(val id: String)

class DevMenuExportedFunction(
  id: String,
  val function: (ReadableMap?) -> Unit
) : DevMenuExportedCallable(id) {
  fun call(args: ReadableMap?) {
    function(args)
  }
}

class DevMenuExportedAction(
  id: String,
  val action: () -> Unit
) : DevMenuExportedCallable(id) {
  var keyCommand: KeyCommand? = null
  var isAvailable = { true }

  fun registerKeyCommand(keyCommand: KeyCommand?) {
    this.keyCommand = keyCommand
  }

  fun call() {
    action()
  }
}
