package expo.modules.image.decoding;

import android.graphics.BitmapFactory;

import com.bumptech.glide.load.Options;
import com.bumptech.glide.load.ResourceDecoder;
import com.bumptech.glide.load.engine.Resource;
import com.bumptech.glide.load.resource.SimpleResource;

import java.io.IOException;
import java.io.InputStream;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

public class InputStreamBitmapFactoryOptionsDecoder implements ResourceDecoder<InputStream, BitmapFactory.Options> {
  @Override
  public boolean handles(@NonNull InputStream source, @NonNull Options options) {
    return true;
  }

  @Nullable
  @Override
  public Resource<BitmapFactory.Options> decode(@NonNull InputStream source, int width, int height, @NonNull Options glideOptions) throws IOException {
    BitmapFactory.Options options = new BitmapFactory.Options();
    options.inJustDecodeBounds = true;
    BitmapFactory.decodeStream(source, null, options);
    return new SimpleResource<>(options);
  }
}
