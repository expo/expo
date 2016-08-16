// Copyright 2015-present 650 Industries. All rights reserved.

package abi6_0_0.host.exp.exponent.modules.api;

import android.graphics.Typeface;
import android.text.TextUtils;

import abi6_0_0.com.facebook.react.bridge.Arguments;
import abi6_0_0.com.facebook.react.bridge.Promise;
import abi6_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi6_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi6_0_0.com.facebook.react.bridge.ReactMethod;
import abi6_0_0.com.facebook.react.bridge.WritableMap;
import abi6_0_0.com.facebook.react.modules.network.OkHttpClientProvider;
import abi6_0_0.com.facebook.react.views.text.ReactFontManager;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.Proxy;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.List;

import host.exp.exponent.ExponentApplication;
import host.exp.exponent.ExponentManifest;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.ResponseBody;
import okio.BufferedSink;
import okio.BufferedSource;
import okio.Okio;

public class FontLoaderModule extends ReactContextBaseJavaModule {
  private final JSONObject mManifest;

  public final class ExponentFontLoadedListener {
    private Promise mPromise;

    public ExponentFontLoadedListener(Promise p) {
      mPromise = p;
    }

    public void onComplete(String fontFamilyName, String url, File fontFile) {
      String reactFamilyName = "ExponentFont-" + fontFamilyName;
      Typeface typeface = Typeface.createFromFile(fontFile);
      ReactFontManager.getInstance().setTypeface(reactFamilyName, Typeface.NORMAL, typeface);
      mPromise.resolve(Arguments.createMap());
    }
  }

  public FontLoaderModule(ReactApplicationContext reactContext, ExponentApplication application, JSONObject manifest) {
    super(reactContext);
    mManifest = manifest;
  }

  @Override
  public String getName() {
    return "ExponentFontLoader";
  }

  @ReactMethod
  public void loadAsync(
    final String fontFamilyName,
    final String url,
    final Promise promise) {

    try {
      loadFontFromDiskCache(fontFamilyName, url, new ExponentFontLoadedListener(promise));
      return;
    } catch (IOException e) {
      try {
        loadFontFromUrl(fontFamilyName, url, new ExponentFontLoadedListener(promise), promise);
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
    final String url,
    final ExponentFontLoadedListener listener) throws IOException, JSONException {
    String filePath = filePathForFont(fontFamilyName, url);

    File file = new File(getReactApplicationContext().getCacheDir(), filePath);

    if (file.exists()) {
      listener.onComplete(fontFamilyName, url, file);
    } else {
      throw new IOException("Cannot load font. File doesn't exist.");
    }
  }

  private void loadFontFromUrl(
    final String fontFamilyName,
    final String url,
    final ExponentFontLoadedListener listener,
    final Promise promise
  ) throws JSONException {
    final String cacheFilePath = filePathForFont(fontFamilyName, url);

    // Fetch typeface
    OkHttpClient client = OkHttpClientProvider.getOkHttpClient();
    Request request = new Request.Builder().url(url).build();

    client.newCall(request).enqueue(new Callback() {
      @Override
      public void onFailure(Call call, IOException e) {
        promise.reject(e);
      }

      @Override
      public void onResponse(Call call, Response response) throws IOException {
        // Get body and length of response
        ResponseBody body = response.body();
        long contentLength = body.contentLength();
        BufferedSource source = body.source();

        // Put the file in a temp dir
        File file = createFile(cacheFilePath);
        BufferedSink sink = Okio.buffer(Okio.sink(file));
        sink.writeAll(response.body().source());
        sink.close();

        listener.onComplete(fontFamilyName, url, file);
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
    pathParts.add(fontFamilyName + "-" + url.hashCode() + ".font");
    return TextUtils.join(File.separator, pathParts);
  }

}
