package expo.modules.video

import androidx.fragment.app.Fragment
import java.lang.ref.WeakReference
import java.util.UUID

interface PictureInPictureFragmentListener {
  fun onPictureInPictureStart()
  fun onPictureInPictureStop()
}

class PictureInPictureHelperFragment(listener: PictureInPictureFragmentListener) : Fragment() {
  val id = "${PictureInPictureHelperFragment::class.java.simpleName}_${UUID.randomUUID()}"
  private val listener = WeakReference(listener)

  fun release() {
    listener.clear()
  }

  override fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean) {
    super.onPictureInPictureModeChanged(isInPictureInPictureMode)

    if (isInPictureInPictureMode) {
      listener.get()?.onPictureInPictureStart()
    } else {
      listener.get()?.onPictureInPictureStop()
    }
  }
}
