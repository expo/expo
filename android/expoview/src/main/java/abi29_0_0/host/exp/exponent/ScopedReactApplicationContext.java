// Copyright 2015-present 650 Industries. All rights reserved.

package abi29_0_0.host.exp.exponent;

import abi29_0_0.com.facebook.react.bridge.ReactApplicationContext;

import host.exp.exponent.utils.ScopedContext;

public class ScopedReactApplicationContext extends ReactApplicationContext {

  public ScopedReactApplicationContext(ScopedContext context) {
    super(context);
  }
}
