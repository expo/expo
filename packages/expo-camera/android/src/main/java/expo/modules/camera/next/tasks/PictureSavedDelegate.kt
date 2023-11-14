package expo.modules.camera.next.tasks

import android.os.Bundle

fun interface PictureSavedDelegate {
  fun onPictureSaved(response: Bundle)
}
