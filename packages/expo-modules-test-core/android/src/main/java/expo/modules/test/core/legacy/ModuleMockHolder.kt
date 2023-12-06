package expo.modules.test.core.legacy

import expo.modules.core.interfaces.services.EventEmitter
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.modules.Module

data class ModuleMockHolder<TestInterfaceType, ModuleType : Module>(
  val module: TestInterfaceType,
  val controller: ModuleController,
  val appContext: AppContext,
  val eventEmitter: EventEmitter,
  val moduleSpy: ModuleType
)
