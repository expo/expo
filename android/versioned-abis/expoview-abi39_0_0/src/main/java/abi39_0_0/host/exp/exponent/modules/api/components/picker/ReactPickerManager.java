/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package abi39_0_0.host.exp.exponent.modules.api.components.picker;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.Spinner;
import android.widget.TextView;
import com.facebook.infer.annotation.Assertions;
import abi39_0_0.com.facebook.react.bridge.ReadableArray;
import abi39_0_0.com.facebook.react.bridge.ReadableMap;
import abi39_0_0.com.facebook.react.uimanager.SimpleViewManager;
import abi39_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi39_0_0.com.facebook.react.uimanager.UIManagerModule;
import abi39_0_0.com.facebook.react.uimanager.ViewProps;
import abi39_0_0.com.facebook.react.uimanager.annotations.ReactProp;
import abi39_0_0.com.facebook.react.uimanager.events.EventDispatcher;
import javax.annotation.Nullable;

/**
 * {@link ViewManager} for the {@link ReactPicker} view. This is abstract because the
 * {@link Spinner} doesn't support setting the mode (dropdown/dialog) outside the constructor, so
 * that is delegated to the separate {@link ReactDropdownPickerManager} and
 * {@link ReactDialogPickerManager} components. These are merged back on the JS side into one
 * React component.
 */
public abstract class ReactPickerManager extends SimpleViewManager<ReactPicker> {

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

  @Override
  protected void onAfterUpdateTransaction(ReactPicker view) {
    super.onAfterUpdateTransaction(view);
    view.updateStagedSelection();
  }

  @Override
  protected void addEventEmitters(
      final ThemedReactContext reactContext,
      final ReactPicker picker) {
    picker.setOnSelectListener(
            new PickerEventEmitter(
                    picker,
                    reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher()));
  }

  private static class ReactPickerAdapter extends BaseAdapter {
    private final LayoutInflater mInflater;
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

      if (convertView == null) {
        int layoutResId = isDropdown
            ? android.R.layout.simple_spinner_dropdown_item
            : android.R.layout.simple_spinner_item;
        convertView = mInflater.inflate(layoutResId, parent, false);
      }

      TextView textView = (TextView) convertView;
      textView.setText(item.getString("label"));
      if (!isDropdown && mPrimaryTextColor != null) {
        textView.setTextColor(mPrimaryTextColor);
      } else if (item.hasKey("color") && !item.isNull("color")) {
        textView.setTextColor(item.getInt("color"));
      }

      return convertView;
    }

    public void setPrimaryTextColor(@Nullable Integer primaryTextColor) {
      mPrimaryTextColor = primaryTextColor;
      notifyDataSetChanged();
    }
  }

  private static class PickerEventEmitter implements ReactPicker.OnSelectListener {

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
  }
}
