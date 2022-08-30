package expo.modules.av.video

import com.facebook.react.bridge.ReadableMap
import expo.modules.av.video.scalablevideoview.ScalableType
import expo.modules.core.arguments.MapArguments
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class VideoViewModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoVideoView")

    View(VideoViewWrapper::class) {
      OnViewDestroys<VideoViewWrapper> { view ->
        view.videoViewInstance.onDropViewInstance()
      }

      Events(
        "onStatusUpdate",
        "onLoadStart",
        "onLoad",
        "onError",
        "onReadyForDisplay",
        "onFullscreenUpdate"
      )

      //region Props set directly in <Video> component

      Prop("status") { view: VideoViewWrapper, status: ReadableMap ->
        view.videoViewInstance.setStatus(MapArguments(status.toHashMap()), null)
      }

      Prop("useNativeControls") { view: VideoViewWrapper, useNativeControls: Boolean ->
        view.videoViewInstance.setUseNativeControls(useNativeControls)
      }

      //endregion

      //region Native only props -- set by Video.js

      Prop("source") { view: VideoViewWrapper, source: ReadableMap ->
        view.videoViewInstance.setSource(MapArguments(source.toHashMap()))
      }

      Prop("resizeMode") { view: VideoViewWrapper, resizeModeOrdinalString: String ->
        view.videoViewInstance.setResizeMode(ScalableType.values()[resizeModeOrdinalString.toInt()])
      }

      //endregion
    }
  }
}
