package expo.modules.core.interfaces;

import com.facebook.react.turbomodule.core.CallInvokerHolderImpl;

public interface JavaScriptContextProvider {
  long getJavaScriptContextRef();

  CallInvokerHolderImpl getJSCallInvokerHolder();
}
