package expo.modules.image

import android.content.Context
import android.util.Log
import com.bumptech.glide.GlideBuilder
import com.bumptech.glide.annotation.GlideModule
import com.bumptech.glide.module.AppGlideModule

/**
 * We need to include an [AppGlideModule] for [GlideModule] annotations
 * to work.
 */
@GlideModule
class ExpoImageAppGlideModule : AppGlideModule() {
  override fun applyOptions(context: Context, builder: GlideBuilder) {
    super.applyOptions(context, builder)

    builder.setLogLevel(
      if (BuildConfig.ALLOW_GLIDE_LOGS) {
        Log.VERBOSE
      } else {
        Log.ERROR
      }
    )
  }
}
