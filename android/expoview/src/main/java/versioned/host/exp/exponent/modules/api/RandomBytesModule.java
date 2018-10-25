package versioned.host.exp.exponent.modules.api;

import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.Callback;

import com.facebook.react.bridge.ReactContextBaseJavaModule;

import java.security.SecureRandom;
import java.util.Map;
import java.util.HashMap;

import android.util.Base64;

/*
    The MIT License (MIT)

    Copyright (c) 2015 Mark Vayngrib

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
*/

public class RandomBytesModule extends ReactContextBaseJavaModule {
    private static final String SEED_KEY = "seed";

    public RandomBytesModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "RNRandomBytes";
    }

    @ReactMethod
    public void randomBytes(int size, Callback success) {
        success.invoke(null, getRandomBytes(size));
    }

    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        constants.put(SEED_KEY, getRandomBytes(4096));
        return constants;
    }

    private String getRandomBytes(int size) {
        SecureRandom sr = new SecureRandom();
        byte[] output = new byte[size];
        sr.nextBytes(output);
        return Base64.encodeToString(output, Base64.NO_WRAP);
    }
}