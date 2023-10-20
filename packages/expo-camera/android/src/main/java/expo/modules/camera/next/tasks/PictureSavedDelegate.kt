package expo.modules.camera.next.tasks

import android.os.Bundle

interface PictureSavedDelegate {
  fun onPictureSaved(response: Bundle)
}
