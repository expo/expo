package expo.modules.video

import androidx.fragment.app.Fragment
import java.util.UUID

class PictureInPictureHelperFragment(private val videoView: VideoView) : Fragment() {
  val id = "${PictureInPictureHelperFragment::class.java.simpleName}_${UUID.randomUUID()}"

  override fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean) {
    super.onPictureInPictureModeChanged(isInPictureInPictureMode)

    if (isInPictureInPictureMode) {
      videoView.layoutForPiPEnter()
      videoView.onPictureInPictureStart(Unit)
    } else {
      videoView.layoutForPiPExit()
      videoView.onPictureInPictureStop(Unit)
    }
  }
}
