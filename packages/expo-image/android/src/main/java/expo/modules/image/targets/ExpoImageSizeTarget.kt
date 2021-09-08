package expo.modules.image.targets

import com.bumptech.glide.request.target.SimpleTarget
import com.bumptech.glide.request.transition.Transition
import expo.modules.image.ExpoImageSize

class ExpoImageSizeTarget : SimpleTarget<ExpoImageSize>() {
  override fun onResourceReady(resource: ExpoImageSize, transition: Transition<in ExpoImageSize>?) {
    // do nothing
  }
}
