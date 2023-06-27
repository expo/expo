/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package abi49_0_0.host.exp.exponent.modules.api.components.picker;

import android.widget.Spinner;

import abi49_0_0.com.facebook.react.module.annotations.ReactModule;
import abi49_0_0.com.facebook.react.uimanager.ThemedReactContext;


/**
 * {@link ReactPickerManager} for {@link ReactPicker} with {@link Spinner#MODE_DIALOG}.
 */
@ReactModule(name = ReactDialogPickerManager.REACT_CLASS)
public class ReactDialogPickerManager extends ReactPickerManager {

  public static final String REACT_CLASS = "RNCAndroidDialogPicker";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected ReactPicker createViewInstance(ThemedReactContext reactContext) {
    return new ReactPicker(reactContext, Spinner.MODE_DIALOG);
  }
}
