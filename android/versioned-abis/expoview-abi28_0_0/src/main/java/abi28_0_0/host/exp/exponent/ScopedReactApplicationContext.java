// Copyright 2015-present 650 Industries. All rights reserved.

package abi28_0_0.host.exp.exponent;

import abi28_0_0.com.facebook.react.bridge.Arguments;
import abi28_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi28_0_0.com.facebook.react.bridge.ReadableMap;

import java.io.File;
import java.io.IOException;

import host.exp.exponent.utils.ExpFileUtils;
import host.exp.exponent.utils.ScopedContext;

public class ScopedReactApplicationContext extends ReactApplicationContext {

  public ScopedReactApplicationContext(ScopedContext context) {
    super(context);
  }
}
