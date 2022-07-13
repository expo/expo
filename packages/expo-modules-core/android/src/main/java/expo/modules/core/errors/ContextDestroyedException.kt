package expo.modules.core.errors

import kotlinx.coroutines.CancellationException

private const val DEFAULT_MESSAGE = "App context destroyed. All coroutines are cancelled."

class ContextDestroyedException(message: String = DEFAULT_MESSAGE) : CancellationException(message)
