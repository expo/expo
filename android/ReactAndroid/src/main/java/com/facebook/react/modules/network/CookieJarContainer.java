package com.facebook.react.modules.network;

import expolib_v1.okhttp3.CookieJar;

public interface CookieJarContainer extends CookieJar {

  void setCookieJar(CookieJar cookieJar);

  void removeCookieJar();

}
