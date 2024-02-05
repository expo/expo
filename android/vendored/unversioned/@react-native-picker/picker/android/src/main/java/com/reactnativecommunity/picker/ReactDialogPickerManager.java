/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.reactnativecommunity.picker;

import android.widget.Spinner;

import androidx.annotation.Nullable;

import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewManagerDelegate;
import com.facebook.react.viewmanagers.RNCAndroidDialogPickerManagerDelegate;
import com.facebook.react.viewmanagers.RNCAndroidDialogPickerManagerInterface;

/**
 * {@link ReactPickerManager} for {@link ReactPicker} with {@link Spinner#MODE_DIALOG}.
 */
@ReactModule(name = ReactDialogPickerManager.REACT_CLASS)
public class ReactDialogPickerManager extends ReactPickerManager implements RNCAndroidDialogPickerManagerInterface<ReactPicker> {

  public static final String REACT_CLASS = "RNCAndroidDialogPicker";
  private final ViewManagerDelegate<ReactPicker> mDelegate;

  @Nullable
  @Override
  protected ViewManagerDelegate<ReactPicker> getDelegate() {
    return mDelegate;
  }

  public ReactDialogPickerManager() {
    mDelegate = new RNCAndroidDialogPickerManagerDelegate<>(this);
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected ReactPicker createViewInstance(ThemedReactContext reactContext) {
    return new ReactPicker(reactContext, Spinner.MODE_DIALOG);
  }
}
