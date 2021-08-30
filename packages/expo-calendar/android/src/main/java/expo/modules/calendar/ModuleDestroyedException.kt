package expo.modules.calendar

import kotlinx.coroutines.CancellationException

class ModuleDestroyedException : CancellationException("Module destroyed, all promises canceled")
