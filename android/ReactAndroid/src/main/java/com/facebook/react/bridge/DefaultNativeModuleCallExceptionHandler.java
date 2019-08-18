/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.react.bridge;

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
        } catch (RuntimeException expoException) {
            try {
                Class.forName("host.exp.exponent.ReactNativeStaticHelpers").getMethod("handleReactNativeError", Throwable.class, String.class, Object.class, Integer.class, Boolean.class).invoke(null, expoException, expoException.getMessage(), null, -1, true);
            } catch (Exception expoHandleErrorException) {
                expoHandleErrorException.printStackTrace();
            }
        }
    }
}
