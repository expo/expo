/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
package com.facebook.react.bridge;

/**
 * Crashy crashy exception handler.
 */
/**
 * Crashy crashy exception handler.
 */
public class DefaultNativeModuleCallExceptionHandler implements NativeModuleCallExceptionHandler {

    @Override
    public void handleException(Exception e) {
        try {
            {
                if (e instanceof RuntimeException) {
                    // preserved.
                    throw (RuntimeException) e;
                } else {
                    throw new RuntimeException(e);
                }
            }
        } catch (RuntimeException exponentException) {
            try {
                Class.forName("host.exp.exponent.ReactNativeStaticHelpers").getMethod("handleReactNativeError", Throwable.class, String.class, Object.class, Integer.class, Boolean.class).invoke(null, exponentException, exponentException.getMessage(), null, -1, true);
            } catch (Exception exponentHandleErrorException) {
                exponentHandleErrorException.printStackTrace();
            }
        }
    }
}
