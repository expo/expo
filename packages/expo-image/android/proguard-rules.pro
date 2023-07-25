# https://bumptech.github.io/glide/doc/download-setup.html#proguard

-keep public class * extends com.bumptech.glide.module.LibraryGlideModule
-keep public class * implements com.bumptech.glide.module.GlideModule
-keep class * extends com.bumptech.glide.module.AppGlideModule {
 <init>(...);
}
-keep public enum com.bumptech.glide.load.ImageHeaderParser$** {
  **[] $VALUES;
  public *;
}
-keep class com.bumptech.glide.load.data.ParcelFileDescriptorRewinder$InternalRewinder {
  *** rewind();
}

-keep public class com.bumptech.glide.request.ThumbnailRequestCoordinator {
  *;
}

-dontwarn com.bumptech.glide.load.resource.bitmap.VideoDecoder

# https://bumptech.github.io/glide/doc/configuration.html#applications

-keep class com.bumptech.glide.GeneratedAppGlideModuleImpl

-keep public class com.bumptech.glide.integration.webp.WebpImage { *; }
-keep public class com.bumptech.glide.integration.webp.WebpFrame { *; }
-keep public class com.bumptech.glide.integration.webp.WebpBitmapFactory { *; }
