package expo.modules.image.decoding;

import android.content.Context;
import android.graphics.BitmapFactory;

import com.bumptech.glide.Glide;
import com.bumptech.glide.Registry;
import com.bumptech.glide.annotation.GlideModule;
import com.bumptech.glide.module.LibraryGlideModule;

import java.io.InputStream;

import androidx.annotation.NonNull;

@GlideModule
public class InputStreamBitmapOptionsDecoderGlideModule extends LibraryGlideModule {
  @Override
  public void registerComponents(@NonNull Context context, @NonNull Glide glide, @NonNull Registry registry) {
    registry.append(InputStream.class, BitmapFactory.Options.class, new InputStreamBitmapFactoryOptionsDecoder());
  }
}
