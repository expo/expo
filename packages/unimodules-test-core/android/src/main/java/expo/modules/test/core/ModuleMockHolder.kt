package expo.modules.test.core

import expo.modules.core.interfaces.services.EventEmitter
import expo.modules.kotlin.AppContext

data class ModuleMockHolder<T>(
  val module: T,
  val controller: ModuleController,
  val appContext: AppContext,
  val eventEmitter: EventEmitter
)
