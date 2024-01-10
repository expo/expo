/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.reactnativecommunity.picker;

import android.content.Context;
import android.content.res.Resources;
import android.graphics.Color;
import android.graphics.Typeface;
import android.util.TypedValue;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.Spinner;
import android.widget.TextView;

import androidx.annotation.NonNull;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.modules.i18nmanager.I18nUtil;
import com.facebook.react.uimanager.*;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.events.EventDispatcher;

import com.facebook.yoga.YogaMeasureFunction;
import com.facebook.yoga.YogaMeasureMode;
import com.facebook.yoga.YogaMeasureOutput;
import com.facebook.yoga.YogaNode;

import java.util.Map;

import javax.annotation.Nullable;

/**
 * {@link ViewManager} for the {@link ReactPicker} view. This is abstract because the
 * {@link Spinner} doesn't support setting the mode (dropdown/dialog) outside the constructor, so
 * that is delegated to the separate {@link ReactDropdownPickerManager} and
 * {@link ReactDialogPickerManager} components. These are merged back on the JS side into one
 * React component.
 */
public abstract class ReactPickerManager extends BaseViewManager<ReactPicker, ReactPickerShadowNode> {
  private static final ReadableArray EMPTY_ARRAY = Arguments.createArray();

  private static final int FOCUS_PICKER = 1;
  private static final int BLUR_PICKER = 2;
  private static final int SET_NATIVE_SELECTED = 3;

  @Nullable
  @Override
  public Map<String, Object> getExportedCustomBubblingEventTypeConstants() {
    return MapBuilder.<String, Object>builder()
        .put(
            "topSelect",
            MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onSelect", "captured", "onSelectCapture")))
        .put(
            "topFocus",
            MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onFocus", "captured", "onFocusCapture")))
        .put(
            "topBlur",
            MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onBlur", "captured", "onBlurCapture")))
        .build();
  }

  @Override
  public @Nullable Map<String, Integer> getCommandsMap() {
    return MapBuilder.of("focus", FOCUS_PICKER, "blur", BLUR_PICKER, "setNativeSelected", SET_NATIVE_SELECTED);
  }

  // method responsible for measuring a picker during the first render on Fabric, every other render
  // the `onMeasure` method of ReactPicker will update the state of the picker with the correct height
  public long measure(
          Context context,
          ReadableMap localData,
          ReadableMap props,
          ReadableMap state,
          float width,
          YogaMeasureMode widthMode,
          float height,
          YogaMeasureMode heightMode,
          @androidx.annotation.Nullable float[] attachmentsPositions) {
    ReactPicker picker = new ReactPicker(context);
    ReadableArray items = props.getArray("items");
    ReactPickerAdapter adapter = new ReactPickerAdapter(context, items);

    int numberOfLines = props.getInt("numberOfLines");
    if (numberOfLines > 0) {
      adapter.setNumberOfLines(numberOfLines);
    }

    int selectedPosition = props.getInt("selected");
    int elementHeight;
    if (selectedPosition < 0 || selectedPosition >= adapter.getCount()) {
      elementHeight = (int) TypedValue.applyDimension(
              TypedValue.COMPLEX_UNIT_DIP,
              50,
              Resources.getSystem().getDisplayMetrics()
      );
    } else {
      View view = "dropdown".equals(props.getString("mode"))
              ? adapter.getDropDownView(selectedPosition, null, picker)
              : adapter.getView(selectedPosition, null, picker);
      picker.measureItem(
              view,
              View.MeasureSpec.makeMeasureSpec(picker.getMeasuredWidth(), View.MeasureSpec.EXACTLY),
              View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED)
      );
      elementHeight = view.getMeasuredHeight();
    }

    return YogaMeasureOutput.make(
            0,
            PixelUtil.toDIPFromPixel(elementHeight));
  }

  @ReactProp(name = "items")
  public void setItems(ReactPicker view, @Nullable ReadableArray items) {
    ReactPickerAdapter adapter = (ReactPickerAdapter) view.getAdapter();

    if (adapter == null) {
      adapter = new ReactPickerAdapter(view.getContext(), items);
      adapter.setPrimaryTextColor(view.getPrimaryColor());
      view.setAdapter(adapter);
    } else {
      adapter.setItems(items);
    }
  }

  @ReactProp(name = ViewProps.COLOR, customType = "Color")
  public void setColor(ReactPicker view, @Nullable Integer color) {
    view.setPrimaryColor(color);
    ReactPickerAdapter adapter = (ReactPickerAdapter) view.getAdapter();
    if (adapter != null) {
      adapter.setPrimaryTextColor(color);
    }
  }

  @ReactProp(name = "prompt")
  public void setPrompt(ReactPicker view, @Nullable String prompt) {
    view.setPrompt(prompt);
  }

  @ReactProp(name = ViewProps.ENABLED, defaultBoolean = true)
  public void setEnabled(ReactPicker view, boolean enabled) {
    view.setEnabled(enabled);
  }

  @ReactProp(name = "selected")
  public void setSelected(ReactPicker view, int selected) {
    view.setStagedSelection(selected);
  }

  @ReactProp(name = ViewProps.BACKGROUND_COLOR)
  @Override
  public void setBackgroundColor(ReactPicker view, @Nullable int color) {
    view.setBackgroundColor(color);
  }

  @ReactProp(name = "dropdownIconColor")
  public void setDropdownIconColor(ReactPicker view, @Nullable int color) {
    view.setDropdownIconColor(color);
  }

  @ReactProp(name = "dropdownIconRippleColor")
  public void setDropdownIconRippleColor(ReactPicker view, @Nullable int color) {
    view.setDropdownIconRippleColor(color);
  }

  @ReactProp(name = ViewProps.NUMBER_OF_LINES, defaultInt = 1)
  public void setNumberOfLines(ReactPicker view, int numberOfLines) {
    ReactPickerAdapter adapter = (ReactPickerAdapter) view.getAdapter();
    if (adapter == null) {
      adapter = new ReactPickerAdapter(view.getContext(), EMPTY_ARRAY);
      adapter.setPrimaryTextColor(view.getPrimaryColor());
      adapter.setNumberOfLines(numberOfLines);
      view.setAdapter(adapter);
    } else {
      adapter.setNumberOfLines(numberOfLines);
    }
  }

  @Override
  protected void onAfterUpdateTransaction(ReactPicker view) {
    super.onAfterUpdateTransaction(view);
    view.updateStagedSelection();
  }

  @Override
  protected void addEventEmitters(
      final ThemedReactContext reactContext,
      final ReactPicker picker) {
    EventDispatcher eventDispatcher =
            UIManagerHelper.getEventDispatcherForReactTag(reactContext, picker.getId());
    if (eventDispatcher == null) {
      return;
    }

    final PickerEventEmitter eventEmitter = new PickerEventEmitter(
        picker,
        eventDispatcher);
    picker.setOnSelectListener(eventEmitter);
    picker.setOnFocusListener(eventEmitter);
  }

  @Override
  public void receiveCommand(@NonNull ReactPicker root, int commandId, @androidx.annotation.Nullable ReadableArray args) {
    switch (commandId) {
      case FOCUS_PICKER:
        root.performClick();
        break;
      case BLUR_PICKER:
        root.clearFocus();
        break;
      case SET_NATIVE_SELECTED:
        Assertions.assertNotNull(args);
        assert args != null;
        setNativeSelected(root, args.getInt(0));
        break;
    }
  }

  @Override
  public void receiveCommand(@NonNull ReactPicker root, String commandId, @androidx.annotation.Nullable ReadableArray args) {
    Assertions.assertNotNull(root);
    switch (commandId) {
      case "focus":
        focus(root);
        break;
      case "blur":
        blur(root);
        break;
      case "setNativeSelected":
        Assertions.assertNotNull(args);
        assert args != null;
        setNativeSelected(root, args.getInt(0));
        break;
    }
  }

  // It seems funny, but these methods are called through delegate on Paper, but on Fabric we need to
  // use `receiveCommand` method and call them there
  public void focus(ReactPicker root) {
    root.performClick();
  }

  public void blur(ReactPicker root) {
    root.clearFocus();
  }

  public void setNativeSelected(ReactPicker picker, int selected) {
    picker.setStagedSelection(selected);
  }

  @Override
  public ReactPickerShadowNode createShadowNodeInstance() {
    return new ReactPickerShadowNode();
  }

  @Override
  public Class<? extends ReactPickerShadowNode> getShadowNodeClass() {
    return ReactPickerShadowNode.class;
  }

  @Override
  public Object updateState(ReactPicker view, ReactStylesDiffMap props, StateWrapper stateWrapper) {
    view.setStateWrapper(stateWrapper);
    return null;
  }

  @Override
  public void updateExtraData(ReactPicker root, Object extraData) {
  }

  private static class ReactPickerAdapter extends BaseAdapter {
    private final LayoutInflater mInflater;
    private int mNumberOfLines = 1;
    private @Nullable Integer mPrimaryTextColor;
    private @Nullable ReadableArray mItems;

    public ReactPickerAdapter(Context context, @Nullable ReadableArray items) {
      super();

      mItems = items;
      mInflater = (LayoutInflater) Assertions.assertNotNull(
          context.getSystemService(Context.LAYOUT_INFLATER_SERVICE));
    }

    public void setItems(@Nullable ReadableArray items) {
      mItems = items;
      notifyDataSetChanged();
    }

    @Override
    public int getCount() {
      if (mItems == null) return 0;
      return mItems.size();
    }

    @Override
    public ReadableMap getItem(int position) {
      if (mItems == null) return null;
      return mItems.getMap(position);
    }

    @Override
    public long getItemId(int position) {
      return position;
    }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
      return getView(position, convertView, parent, false);
    }

    @Override
    public View getDropDownView(int position, View convertView, ViewGroup parent) {
      return getView(position, convertView, parent, true);
    }

    private View getView(int position, View convertView, ViewGroup parent, boolean isDropdown) {
      ReadableMap item = getItem(position);
      @Nullable ReadableMap style = null;
      boolean enabled = true;

      if (item.hasKey("style")) {
        style = item.getMap("style");
      }

      if (convertView == null) {
        int layoutResId = isDropdown
              ? R.layout.simple_spinner_dropdown_item
              : R.layout.simple_spinner_item;
        convertView = mInflater.inflate(layoutResId, parent, false);
      }

      if (item.hasKey("enabled")) {
        enabled = item.getBoolean("enabled");
      }

      convertView.setEnabled(enabled);
      // Seems counter intuitive, but this makes the specific item not clickable when enable={false}
      convertView.setClickable(!enabled);
      
      final TextView textView = (TextView) convertView;
      textView.setText(item.getString("label"));
      textView.setMaxLines(mNumberOfLines);

      if (style != null) {
        if (style.hasKey("backgroundColor") && !style.isNull("backgroundColor")) {
          convertView.setBackgroundColor(style.getInt("backgroundColor"));
        } else {
          convertView.setBackgroundColor(Color.TRANSPARENT);
        }
        
        if (style.hasKey("color") && !style.isNull("color")) {
          textView.setTextColor(style.getInt("color"));
        }

        if (style.hasKey("fontSize") && !style.isNull("fontSize") && style.getDouble("fontSize") > 0.1) {
          textView.setTextSize((float)style.getDouble("fontSize"));
        }
        
        if (style.hasKey("fontFamily") && !style.isNull("fontFamily") && style.getString("fontFamily").length() > 0) {
          Typeface face = Typeface.create(style.getString("fontFamily"), Typeface.NORMAL);
          textView.setTypeface(face);
        }
      }

      if (!isDropdown && mPrimaryTextColor != null) {
        textView.setTextColor(mPrimaryTextColor);
      } else if (item.hasKey("color") && !item.isNull("color")) {
        textView.setTextColor(item.getInt("color"));
      }

      if (item.hasKey("contentDescription") && !item.isNull("contentDescription")) {
        textView.setContentDescription(item.getString("contentDescription"));
      }

      if (item.hasKey("fontFamily") && !item.isNull("fontFamily")) {
        Typeface face = Typeface.create(item.getString("fontFamily"), Typeface.NORMAL);
        textView.setTypeface(face);
      }

      boolean isRTL = I18nUtil.getInstance().isRTL(convertView.getContext());
      if (isRTL) {
        convertView.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        convertView.setTextDirection(View.TEXT_DIRECTION_RTL);
      } else {
        convertView.setLayoutDirection(View.LAYOUT_DIRECTION_LTR);
        convertView.setTextDirection(View.TEXT_DIRECTION_LTR);
      }

      return convertView;
    }

    public void setPrimaryTextColor(@Nullable Integer primaryTextColor) {
      mPrimaryTextColor = primaryTextColor;
      notifyDataSetChanged();
    }

    public void setNumberOfLines(int numberOfLines) {
      mNumberOfLines = numberOfLines;
      notifyDataSetChanged();
    }
  }

  private static class PickerEventEmitter implements ReactPicker.OnSelectListener, ReactPicker.OnFocusListener {

    private final ReactPicker mReactPicker;
    private final EventDispatcher mEventDispatcher;

    public PickerEventEmitter(ReactPicker reactPicker, EventDispatcher eventDispatcher) {
      mReactPicker = reactPicker;
      mEventDispatcher = eventDispatcher;
    }

    @Override
    public void onItemSelected(int position) {
      mEventDispatcher.dispatchEvent( new PickerItemSelectEvent(
              mReactPicker.getId(), position));
    }

    @Override
    public void onPickerBlur() {
      mEventDispatcher.dispatchEvent( new PickerBlurEvent(mReactPicker.getId()));
    }

    @Override
    public void onPickerFocus() {
      mEventDispatcher.dispatchEvent( new PickerFocusEvent(mReactPicker.getId()));
    }
  }
}
