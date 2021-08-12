package expo.modules.barcodescanner

import kotlinx.coroutines.CancellationException

class ScopeCancellationException : CancellationException("View destroyed, scope canceled")
