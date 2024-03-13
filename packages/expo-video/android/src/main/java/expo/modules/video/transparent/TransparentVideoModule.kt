@file:OptIn(EitherType::class)

package expo.modules.video.transparent

import android.app.Activity
import android.view.View
import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.views.ViewDefinitionBuilder
import expo.modules.video.VideoPlayer

// https://developer.android.com/guide/topics/media/media3/getting-started/migration-guide#improvements_in_media3
@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
class TransparentVideoModule : Module() {
  private val activity: Activity
    get() = appContext.activityProvider?.currentActivity ?: throw Exceptions.MissingActivity()

  override fun definition() = ModuleDefinition {
    Name("ExpoTransparentVideo")

    Function("isPictureInPictureSupported") {
      return@Function TransparentVideoView.isPictureInPictureSupported()
    }

    View(TransparentVideoView::class) {
      Prop("player") { view: TransparentVideoView, player: VideoPlayer ->
        view.videoPlayer = player
        player.prepare()
      }

      OnViewDestroys {
        TransparentVideoManager.unregisterVideoView(it)
      }
    }

    OnActivityEntersForeground {
      TransparentVideoManager.onAppForegrounded()
    }

    OnActivityEntersBackground {
      TransparentVideoManager.onAppBackgrounded()
    }
  }
}

@Suppress("FunctionName")
private inline fun <reified T : View, reified PropType, reified CustomValueType> ViewDefinitionBuilder<T>.PropGroup(
  vararg props: Pair<String, CustomValueType>,
  noinline body: (view: T, value: CustomValueType, prop: PropType) -> Unit
) {
  for ((name, value) in props) {
    Prop<T, PropType>(name) { view, prop -> body(view, value, prop) }
  }
}
