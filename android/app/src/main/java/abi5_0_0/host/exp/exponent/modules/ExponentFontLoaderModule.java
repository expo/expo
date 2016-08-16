// Copyright 2015-present 650 Industries. All rights reserved.

package abi5_0_0.host.exp.exponent.modules;

import android.graphics.Typeface;
import android.text.TextUtils;

import abi5_0_0.com.facebook.react.bridge.Promise;
import abi5_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi5_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi5_0_0.com.facebook.react.bridge.ReactMethod;
import abi5_0_0.com.facebook.react.modules.network.OkHttpClientProvider;
import abi5_0_0.com.facebook.react.views.text.ReactFontManager;
import com.squareup.okhttp.Callback;
import com.squareup.okhttp.OkHttpClient;
import com.squareup.okhttp.Request;
import com.squareup.okhttp.Response;
import com.squareup.okhttp.ResponseBody;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import host.exp.exponent.ExponentApplication;
import host.exp.exponent.ExponentManifest;
import okio.BufferedSink;
import okio.BufferedSource;
import okio.Okio;

public class ExponentFontLoaderModule extends ReactContextBaseJavaModule {
  private Map<String, String> mFontRegistry;
  private final JSONObject mManifest;

  public final class ExponentFontLoadedListener {
    private Promise mPromise;

    public ExponentFontLoadedListener(Promise p) {
      mPromise = p;
    }

    public void onComplete(String fontFamilyName, int fontStyle, String url, File fontFile) {
      Typeface typeface = Typeface.createFromFile(fontFile);
      // Actually set the typeface for React to use
      ReactFontManager.getInstance().setTypeface(fontFamilyName, fontStyle, typeface);
      mFontRegistry.put(fontFamilyName, url);
      mPromise.resolve(fontFamilyName);
    }
  }

  public ExponentFontLoaderModule(ReactApplicationContext reactContext, ExponentApplication application, JSONObject manifest) {
    super(reactContext);
    mFontRegistry = new HashMap<>();
    mManifest = manifest;
  }

  @Override
  public String getName() {
    return "ExponentFontLoader";
  }

  @ReactMethod
  public void loadFontWithFamilyNameAsync(
    final String fontFamilyName,
    final int fontStyle,
    final String url,
    final Promise promise) {

    // check to see if we've already loaded the font at this URL
    if (mFontRegistry.containsKey(url)) {
      promise.resolve(mFontRegistry.get(url));
      return;
    }

    try {
      loadFontFromDiskCache(fontFamilyName, fontStyle, url, new ExponentFontLoadedListener(promise));
      return;
    } catch (IOException e) {
      try {
        loadFontFromUrl(fontFamilyName, fontStyle, url, new ExponentFontLoadedListener(promise), promise);
      } catch (JSONException manifestErr) {
        promise.reject(manifestErr);
      }
      return;
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  private void loadFontFromDiskCache(
    final String fontFamilyName,
    final int fontStyle,
    final String url,
    final ExponentFontLoadedListener listener) throws IOException, JSONException {
    String filePath = filePathForFont(fontFamilyName, fontStyle, url);

    File file = new File(getReactApplicationContext().getCacheDir(), filePath);

    if (file.exists()) {
      listener.onComplete(fontFamilyName, fontStyle, url, file);
    } else {
      throw new IOException("Cannot load font. File doesn't exist.");
    }
  }

  private void loadFontFromUrl(
    final String fontFamilyName,
    final int fontStyle,
    final String url,
    final ExponentFontLoadedListener listener,
    final Promise promise
  ) throws JSONException {
    final String cacheFilePath = filePathForFont(fontFamilyName, fontStyle, url);

    // Fetch typeface
    OkHttpClient client = OkHttpClientProvider.getOkHttpClient();
    Request request = new Request.Builder().url(url).build();

    client.newCall(request).enqueue(new Callback() {
      @Override
      public void onFailure(Request request, IOException e) {
        promise.reject(e);
      }

      @Override
      public void onResponse(Response response) throws IOException {
        // Get body and length of response
        ResponseBody body = response.body();
        long contentLength = body.contentLength();
        BufferedSource source = body.source();

        // Put the file in a temp dir
        File file = createFile(cacheFilePath);
        BufferedSink sink = Okio.buffer(Okio.sink(file));
        sink.writeAll(response.body().source());
        sink.close();

        listener.onComplete(fontFamilyName, fontStyle, url, file);
      }
    });
  }

  private File createFile(String filePath) throws IOException {
    File file = new File(getReactApplicationContext().getCacheDir(), filePath);
    if (file.getParentFile().mkdirs() || file.getParentFile().isDirectory()) {
      return file;
    } else {
      throw new IOException("Couldn't create directories.");
    }
  }

  private String filePathForFont(
    String fontFamilyName,
    int fontStyle,
    String url
  ) throws JSONException {
    String expId;
    try {
      expId = URLEncoder.encode(mManifest.getString(ExponentManifest.MANIFEST_ID_KEY), "UTF-8");
    } catch (JSONException e) {
      throw new JSONException("Requires experience Id");
    } catch (UnsupportedEncodingException e) {
      throw new JSONException("Can't encode experience Id as UTF-8");
    }

    List<String> pathParts = new ArrayList<String>();
    pathParts.add(Integer.toString(expId.hashCode()));
    pathParts.add("fonts");
    pathParts.add(fontFamilyName + "-" + fontStyle + "-" + url.hashCode() + ".font");
    return TextUtils.join(File.separator, pathParts);
  }

}
