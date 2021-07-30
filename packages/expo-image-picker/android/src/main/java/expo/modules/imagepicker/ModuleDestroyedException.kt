package expo.modules.imagepicker

import kotlinx.coroutines.CancellationException

class ModuleDestroyedException : CancellationException(ImagePickerConstants.PROMISES_CANCELED)
