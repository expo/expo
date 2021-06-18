package expo.modules.image

import com.bumptech.glide.annotation.GlideModule
import com.bumptech.glide.module.AppGlideModule

/**
 * We need to include an [AppGlideModule] for [GlideModule] annotations
 * to work.
 */
@GlideModule
class ExpoImageAppGlideModule : AppGlideModule()
