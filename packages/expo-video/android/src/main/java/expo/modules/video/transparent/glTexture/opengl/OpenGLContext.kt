package expo.modules.video.transparent.glTexture.opengl

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.asCoroutineDispatcher
import kotlinx.coroutines.channels.Channel.Factory.UNLIMITED
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.launch
import java.util.concurrent.Executors

/**
 * This context enables OpenGL commands to be dispatched on a dedicated thread as required by OpenGL.
 */
internal class OpenGLContext(scope: CoroutineScope) {
  private val commandsQueue = MutableSharedFlow<() -> Unit>(extraBufferCapacity = UNLIMITED)

  init {
    scope.launch(Executors.newSingleThreadExecutor().asCoroutineDispatcher()) {
      commandsQueue.collect { it.invoke() }
    }
  }

  fun execute(commands: () -> Unit) {
    commandsQueue.tryEmit { commands() }
  }
}
