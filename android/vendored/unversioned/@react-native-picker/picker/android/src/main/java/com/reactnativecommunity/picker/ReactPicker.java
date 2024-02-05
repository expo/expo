/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.reactnativecommunity.picker;

import android.content.Context;
import android.content.ContextWrapper;
import android.content.res.ColorStateList;
import android.content.res.Resources;
import android.graphics.Color;
import android.graphics.PorterDuff;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.LayerDrawable;
import android.graphics.drawable.RippleDrawable;
import android.util.AttributeSet;
import android.util.TypedValue;
import android.view.View;
import android.widget.AdapterView;
import android.widget.Spinner;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.modules.i18nmanager.I18nUtil;
import com.facebook.react.uimanager.UIManagerModule;

import javax.annotation.Nullable;

// Inherit after FabricEnabledPicker which is a subclass of AppCompatSpinner and
// has different implementation on Paper and Fabric (thanks to gradle sourceSets).
// This way we can avoid having to duplicate the code in both implementations.
// Paper version of FabricEnabledPicker has necessary methods implemented as no-ops,
// while Fabric version has the actual implementation which allows us to change the
// shadow node state.
public class ReactPicker extends FabricEnabledPicker {

  private int mMode = Spinner.MODE_DIALOG;
  private @Nullable Integer mPrimaryColor;
  private @Nullable OnSelectListener mOnSelectListener;
  private @Nullable OnFocusListener mOnFocusListener;
  private @Nullable Integer mStagedSelection;
  private int mOldElementSize = Integer.MIN_VALUE;
  private boolean mIsOpen = false;

  private final OnItemSelectedListener mItemSelectedListener = new OnItemSelectedListener() {
    @Override
    public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
      if (mOnSelectListener != null) {
        mOnSelectListener.onItemSelected(position);
      }
    }

    @Override
    public void onNothingSelected(AdapterView<?> parent) {
      if (mOnSelectListener != null) {
        mOnSelectListener.onItemSelected(-1);
      }
    }
  };

  /**
   * Listener interface for ReactPicker events.
   */
  public interface OnSelectListener {
    void onItemSelected(int position);
  }

  public interface OnFocusListener {
    void onPickerBlur();
    void onPickerFocus();
  }

  public ReactPicker(Context context) {
    super(context);
    handleRTL(context);
    setSpinnerBackground();
  }

  public ReactPicker(Context context, int mode) {
    super(context, mode);
    mMode = mode;
    handleRTL(context);
    setSpinnerBackground();
  }

  public ReactPicker(Context context, AttributeSet attrs) {
    super(context, attrs);
    handleRTL(context);
    setSpinnerBackground();
  }

  public ReactPicker(Context context, AttributeSet attrs, int defStyle) {
    super(context, attrs, defStyle);
    handleRTL(context);
    setSpinnerBackground();
  }

  public ReactPicker(Context context, AttributeSet attrs, int defStyle, int mode) {
    super(context, attrs, defStyle, mode);
    mMode = mode;
    handleRTL(context);
    setSpinnerBackground();
  }

  private void setSpinnerBackground() {
    this.setBackgroundResource(R.drawable.spinner_dropdown_background);
    // If there are multiple spinners rendered, for some reason, next spinners are inheriting
    // background color of previous spinners if there is no color provided as a style
    // To prevent, let's set color manually in constructor, if any value will be provided as a style,
    // it will override value that is set here.
    this.setBackgroundColor(Color.TRANSPARENT);
  }

  private void handleRTL(Context context) {
    boolean isRTL = I18nUtil.getInstance().isRTL(context);
    if (isRTL) {
      this.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
      this.setTextDirection(View.TEXT_DIRECTION_RTL);
    } else {
      this.setLayoutDirection(View.LAYOUT_DIRECTION_LTR);
      this.setTextDirection(View.TEXT_DIRECTION_LTR);
    }
  }

  private final Runnable measureAndLayout = new Runnable() {
    @Override
    public void run() {
      measure(
          MeasureSpec.makeMeasureSpec(getWidth(), MeasureSpec.EXACTLY),
          MeasureSpec.makeMeasureSpec(getHeight(), MeasureSpec.EXACTLY));
      layout(getLeft(), getTop(), getRight(), getBottom());
    }
  };

  @Override
  public void requestLayout() {
    super.requestLayout();

    // The spinner relies on a measure + layout pass happening after it calls requestLayout().
    // Without this, the widget never actually changes the selection and doesn't call the
    // appropriate listeners. Since we override onLayout in our ViewGroups, a layout pass never
    // happens after a call to requestLayout, so we simulate one here.
    post(measureAndLayout);
  }

  @Override
  public boolean performClick() {
    // When picker is opened, emit focus event.
    mIsOpen = true;
    if (mOnFocusListener != null) {
      mOnFocusListener.onPickerFocus();
    }
    return super.performClick();
  }

  @Override
  public void onWindowFocusChanged(boolean hasWindowFocus) {
    // When view that holds picker gains focus and picker was opened,
    // then picker lost focus, so emit blur event.
    if (mIsOpen && hasWindowFocus) {
      mIsOpen = false;
      if (mOnFocusListener != null) {
        mOnFocusListener.onPickerBlur();
      }
    }
  }

  @Override
  protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
    super.onLayout(changed, left, top, right, bottom);

    // onItemSelected gets fired immediately after layout because checkSelectionChanged() in
    // AdapterView updates the selection position from the default INVALID_POSITION.
    // To match iOS behavior, which no onItemSelected during initial layout.
    // We setup the listener after layout.
    if (getOnItemSelectedListener() == null)
      setOnItemSelectedListener(mItemSelectedListener);
  }

  @Override
  protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
    super.onMeasure(widthMeasureSpec, heightMeasureSpec);

    int selectedPosition = getSelectedItemPosition();
    int elementSize;
    if (selectedPosition < 0 || getAdapter() == null || selectedPosition >= getAdapter().getCount()) {
      elementSize = (int) TypedValue.applyDimension(
              TypedValue.COMPLEX_UNIT_DIP,
              50,
              Resources.getSystem().getDisplayMetrics()
      );
    } else {
      View view = getAdapter().getView(selectedPosition, null, this);
      measureChild(
              view,
              View.MeasureSpec.makeMeasureSpec(getMeasuredWidth(), View.MeasureSpec.EXACTLY),
              View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED)
      );
      elementSize = view.getMeasuredHeight();
    }

    if (elementSize != mOldElementSize) {
      UIManagerModule uiManager = getReactContext().getNativeModule(UIManagerModule.class);
      if (uiManager != null) {
        uiManager.setViewLocalData(getId(), new ReactPickerLocalData(elementSize));
      }
      mOldElementSize = elementSize;
      this.setMeasuredHeight(elementSize);
    }
  }

  public void measureItem(View view, int parentWidthMeasureSpec, int parentHeightMeasureSpec) {
    measureChild(view, parentWidthMeasureSpec, parentHeightMeasureSpec);
  }

  public void clearFocus() {
    super.setFocusableInTouchMode(true);
    super.setFocusable(true);
    super.onDetachedFromWindow();
  }

  public void setOnSelectListener(@Nullable OnSelectListener onSelectListener) {
    mOnSelectListener = onSelectListener;
  }

  public void setOnFocusListener(@Nullable OnFocusListener onFocusListener) {
    mOnFocusListener = onFocusListener;
  }

  @Nullable public OnSelectListener getOnSelectListener() {
    return mOnSelectListener;
  }

  @Nullable public OnFocusListener getOnFocusListener() { return mOnFocusListener; }

  /**
   * Will cache "selection" value locally and set it only once {@link #updateStagedSelection} is
   * called
   */
  public void setStagedSelection(int selection) {
    mStagedSelection = selection;
  }

  public void updateStagedSelection() {
    if (mStagedSelection != null) {
      setSelectionWithSuppressEvent(mStagedSelection);
      mStagedSelection = null;
    }
  }

  /**
   * Set the selection while suppressing the follow-up {@link OnSelectListener#onItemSelected(int)}
   * event. This is used so we don't get an event when changing the selection ourselves.
   *
   * @param position the position of the selected item
   */
  private void setSelectionWithSuppressEvent(int position) {
    if (position != getSelectedItemPosition()) {
      setOnItemSelectedListener(null);
      setSelection(position, false);
      setOnItemSelectedListener(mItemSelectedListener);
    }
  }

  public @Nullable Integer getPrimaryColor() {
    return mPrimaryColor;
  }

  public void setPrimaryColor(@Nullable Integer primaryColor) {
    mPrimaryColor = primaryColor;
  }

  public void setDropdownIconColor(@Nullable int color) {
    LayerDrawable drawable = (LayerDrawable) this.getBackground();
    RippleDrawable backgroundDrawable = (RippleDrawable) drawable.findDrawableByLayerId(R.id.dropdown_icon);
    backgroundDrawable.setColorFilter(color, PorterDuff.Mode.SRC_ATOP);
  }

  public void setDropdownIconRippleColor(@Nullable int color) {
    LayerDrawable drawable = (LayerDrawable) this.getBackground();
    RippleDrawable backgroundDrawable = (RippleDrawable) drawable.findDrawableByLayerId(R.id.dropdown_icon);
    backgroundDrawable.setColor(ColorStateList.valueOf(color));
  }

  public void setBackgroundColor(@Nullable int color) {
    LayerDrawable drawable = (LayerDrawable) this.getBackground();
    GradientDrawable backgroundDrawable = (GradientDrawable) drawable.findDrawableByLayerId(R.id.dropdown_background);
    backgroundDrawable.setColor(color);
  }

  @VisibleForTesting
  public int getMode() {
    return mMode;
  }

  private ReactContext getReactContext() {
    Context context = getContext();
    if (!(context instanceof ReactContext) && context instanceof ContextWrapper) {
      context = ((ContextWrapper) context).getBaseContext();
    }
    return (ReactContext) context;
  }
}
