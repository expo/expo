package abi49_0_0.expo.modules.core.interfaces;

import abi49_0_0.com.facebook.react.turbomodule.core.CallInvokerHolderImpl;

public interface JavaScriptContextProvider {
  long getJavaScriptContextRef();

  CallInvokerHolderImpl getJSCallInvokerHolder();
}
