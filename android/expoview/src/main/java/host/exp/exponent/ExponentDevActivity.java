// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent;

import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import androidx.core.content.ContextCompat;
import androidx.appcompat.app.AppCompatActivity;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.TypedValue;
import android.view.View;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.CompoundButton;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;

import javax.inject.Inject;

import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.storage.ExponentSharedPreferences;
import host.exp.exponent.kernel.Kernel;
import host.exp.expoview.Exponent;
import host.exp.expoview.R;

public class ExponentDevActivity extends AppCompatActivity {

  LinearLayout mLinearLayout;

  @Inject
  ExponentSharedPreferences mExponentSharedPreferences;

  @Inject
  Kernel mKernel;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(R.layout.exponent_dev_activity);
    mLinearLayout = (LinearLayout) findViewById(R.id.linearLayout);
    NativeModuleDepsProvider.getInstance().inject(ExponentDevActivity.class, this);

    addCheckbox("Use Internet Kernel", ExponentSharedPreferences.USE_INTERNET_KERNEL_KEY, null);
    addReloadKernelButton();
  }

  private void addCheckbox(final String text, final String key, final CompoundButton.OnCheckedChangeListener listener) {
    CheckBox checkBox = (CheckBox) getLayoutInflater().inflate(R.layout.exponent_check_box, null);

    LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.WRAP_CONTENT,
        LinearLayout.LayoutParams.WRAP_CONTENT
    );
    params.setMargins(0, 0, 0, (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 20,
        getResources().getDisplayMetrics()));
    checkBox.setLayoutParams(params);

    checkBox.setTextColor(ContextCompat.getColor(this, R.color.colorText));
    checkBox.setText(text);
    checkBox.setChecked(mExponentSharedPreferences.getBoolean(key));
    checkBox.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
      @Override
      public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
        if (listener != null) {
          listener.onCheckedChanged(buttonView, isChecked);
        }
        mExponentSharedPreferences.setBoolean(key, isChecked);
      }
    });

    mLinearLayout.addView(checkBox);
  }

  private void addReloadKernelButton() {
    Button reloadButton = (Button) getLayoutInflater().inflate(R.layout.exponent_button, null);
    LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.WRAP_CONTENT,
        LinearLayout.LayoutParams.WRAP_CONTENT);
    params.setMargins(0, 0, 0, (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 20,
        getResources().getDisplayMetrics()));
    reloadButton.setLayoutParams(params);

    reloadButton.setText("Reload Kernel");
    reloadButton.setOnClickListener(new Button.OnClickListener() {
      @Override
      public void onClick(View v) {
        mKernel.reloadJSBundle();
      }
    });

    mLinearLayout.addView(reloadButton);
  }
}
