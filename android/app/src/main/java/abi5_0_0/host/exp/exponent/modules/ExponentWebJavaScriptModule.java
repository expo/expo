// Copyright 2015-present 650 Industries. All rights reserved.

package abi5_0_0.host.exp.exponent.modules;

import android.webkit.ValueCallback;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import abi5_0_0.com.facebook.react.bridge.Promise;
import abi5_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi5_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi5_0_0.com.facebook.react.bridge.ReactMethod;
import host.exp.exponent.utils.AsyncCondition;

public class ExponentWebJavaScriptModule extends ReactContextBaseJavaModule {

  private boolean mIsWebViewLoaded = false;
  private WebView mWebView;

  public ExponentWebJavaScriptModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "ExponentWebJavaScript";
  }

  private String getKey() {
    return getName() + hashCode();
  }

  @ReactMethod
  public void loadHTML(final String html) {
    mIsWebViewLoaded = false;
    getReactApplicationContext().runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        mWebView = new WebView(getReactApplicationContext());
        mWebView.getSettings().setJavaScriptEnabled(true);
        mWebView.setWebViewClient(new WebViewClient() {

          public void onPageFinished(WebView view, String url) {
            mIsWebViewLoaded = true;
            AsyncCondition.notify(getKey());
          }
        });
        mWebView.loadDataWithBaseURL("", html, "text/html", "UTF-8", "");
      }
    });
  }

  @ReactMethod
  public void executeAsync(final String js, final Promise promise) {
    AsyncCondition.wait(getKey(), new AsyncCondition.AsyncConditionListener() {
      @Override
      public boolean isReady() {
        return mIsWebViewLoaded;
      }

      @Override
      public void execute() {
        getReactApplicationContext().runOnUiQueueThread(new Runnable() {
          @Override
          public void run() {
            mWebView.evaluateJavascript(js, new ValueCallback<String>() {
              @Override
              public void onReceiveValue(String value) {
                promise.resolve(value);
              }
            });
          }
        });
      }
    });
  }
}
