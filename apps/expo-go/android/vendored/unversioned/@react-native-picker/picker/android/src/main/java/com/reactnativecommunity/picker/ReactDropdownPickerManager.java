/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.reactnativecommunity.picker;

import android.widget.Spinner;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewManagerDelegate;
import com.facebook.react.viewmanagers.RNCAndroidDropdownPickerManagerDelegate;
import com.facebook.react.viewmanagers.RNCAndroidDropdownPickerManagerInterface;

/**
 * {@link ReactPickerManager} for {@link ReactPicker} with {@link Spinner#MODE_DROPDOWN}.
 */
@ReactModule(name = ReactDropdownPickerManager.REACT_CLASS)
public class ReactDropdownPickerManager extends ReactPickerManager implements RNCAndroidDropdownPickerManagerInterface<ReactPicker> {

  public static final String REACT_CLASS = "RNCAndroidDropdownPicker";
  private final ViewManagerDelegate<ReactPicker> mDelegate = new RNCAndroidDropdownPickerManagerDelegate<>(this);

  @Nullable
  @Override
  protected ViewManagerDelegate<ReactPicker> getDelegate() {
    return mDelegate;
  }

  public ReactDropdownPickerManager() {
  }

  @NonNull
  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @NonNull
  @Override
  protected ReactPicker createViewInstance(@NonNull ThemedReactContext reactContext) {
    return new ReactPicker(reactContext, Spinner.MODE_DROPDOWN);
  }
}
