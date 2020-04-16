package expo.modules.image.okhttp;

import android.content.Context;

import com.bumptech.glide.Glide;
import com.bumptech.glide.Registry;
import com.bumptech.glide.annotation.GlideModule;
import com.bumptech.glide.integration.okhttp3.OkHttpUrlLoader;
import com.bumptech.glide.load.model.GlideUrl;
import com.bumptech.glide.module.LibraryGlideModule;

import java.io.InputStream;

import androidx.annotation.NonNull;
import okhttp3.OkHttpClient;

@GlideModule
public final class ExpoImageOkHttpClientGlideModule extends LibraryGlideModule {
  @Override
  public void registerComponents(@NonNull Context context, @NonNull Glide glide, @NonNull Registry registry) {
    OkHttpClient client = new OkHttpClient.Builder()
      .addNetworkInterceptor(OkHttpClientProgressInterceptor.getInstance())
      .build();
    OkHttpUrlLoader.Factory factory = new OkHttpUrlLoader.Factory(client);

    registry.replace(GlideUrl.class, InputStream.class, factory);
  }
}
