package expo.modules.image;

import com.bumptech.glide.annotation.GlideModule;
import com.bumptech.glide.module.AppGlideModule;

/**
 * We need to include an {@link AppGlideModule} for {@link GlideModule} annotations
 * to work.
 */
@GlideModule
public class ExpoImageAppGlideModule extends AppGlideModule {
}
