package expo.modules.taskManager;

import android.os.Bundle;

// Wrapper used for passing the emit function from the EventEmitter between Kotlin and Java
@FunctionalInterface
interface EmitEventWrapper {
  void emit(String name, Bundle body);
}
