package expo.modules.core.interfaces;

import com.facebook.react.common.annotations.FrameworkAPI;
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl;

import androidx.annotation.OptIn;

public interface JavaScriptContextProvider {
  long getJavaScriptContextRef();

  @OptIn(markerClass = FrameworkAPI.class)
  CallInvokerHolderImpl getJSCallInvokerHolder();
}
