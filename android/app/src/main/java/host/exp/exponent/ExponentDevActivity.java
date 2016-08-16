package host.exp.exponent;

import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.support.v4.content.ContextCompat;
import android.support.v7.app.AppCompatActivity;
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

import butterknife.Bind;
import butterknife.ButterKnife;
import host.exp.exponent.storage.ExponentSharedPreferences;
import host.exp.exponent.kernel.Kernel;

public class ExponentDevActivity extends AppCompatActivity {

  @Bind(R.id.linearLayout) LinearLayout mLinearLayout;

  @Inject
  ExponentSharedPreferences mExponentSharedPreferences;

  @Inject
  Kernel mKernel;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(R.layout.exponent_dev_activity);
    ButterKnife.bind(this);
    ((ExponentApplication) getApplication()).getAppComponent().inject(this);

    addCheckbox("Debug Mode Enabled" + (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ?
            " (must enable \"Draw over other apps\" in Settings)" : ""),
        ExponentSharedPreferences.DEBUG_MODE_KEY, debugModeChangeListener());
    addCheckbox("Use Internet Kernel", ExponentSharedPreferences.USE_INTERNET_KERNEL_KEY, null);
    addCheckbox("Kernel Debug Mode Enabled", ExponentSharedPreferences.KERNEL_DEBUG_MODE_KEY,
        debugModeChangeListener());
    addKernelUrlInput();
    addReloadKernelButton();
  }

  private CompoundButton.OnCheckedChangeListener debugModeChangeListener() {
    return new CompoundButton.OnCheckedChangeListener() {
      @Override
      public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
          if (isChecked && !Settings.canDrawOverlays(ExponentDevActivity.this)) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + getPackageName()));
            startActivity(intent);
          }
        }
      }
    };
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

  private void addKernelUrlInput() {
    TextView kernelUrlLabel = new TextView(this);
    kernelUrlLabel.setText("Local kernel URL:");
    kernelUrlLabel.setTextColor(Color.WHITE);
    mLinearLayout.addView(kernelUrlLabel);

    final EditText kernelUrl = new EditText(this);
    kernelUrl.setTextColor(Color.WHITE);
    kernelUrl.setText(mExponentSharedPreferences.getString(ExponentSharedPreferences.LOCAL_KERNEL_URL_KEY,
        Kernel.defaultLocalKernelUrl()));
    kernelUrl.addTextChangedListener(new TextWatcher() {
      @Override
      public void beforeTextChanged(CharSequence s, int start, int count, int after) {

      }

      @Override
      public void onTextChanged(CharSequence s, int start, int before, int count) {

      }

      @Override
      public void afterTextChanged(Editable s) {
        if (s.toString().equals(Kernel.defaultLocalKernelUrl())) {
          mExponentSharedPreferences.delete(ExponentSharedPreferences.LOCAL_KERNEL_URL_KEY);
        } else {
          mExponentSharedPreferences.setString(ExponentSharedPreferences.LOCAL_KERNEL_URL_KEY, s.toString());
        }
      }
    });

    mLinearLayout.addView(kernelUrl);

    Button clearButton = (Button) getLayoutInflater().inflate(R.layout.exponent_button, null);
    LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.WRAP_CONTENT,
        LinearLayout.LayoutParams.WRAP_CONTENT);
    params.setMargins(0, 0, 0, (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 20,
        getResources().getDisplayMetrics()));
    clearButton.setLayoutParams(params);

    clearButton.setText("Clear");
    clearButton.setOnClickListener(new Button.OnClickListener() {
      @Override
      public void onClick(View v) {
        kernelUrl.setText("");
      }
    });

    mLinearLayout.addView(clearButton);

    Button resetButton = (Button) getLayoutInflater().inflate(R.layout.exponent_button, null);
    resetButton.setLayoutParams(params);

    resetButton.setText("Reset local kernel URL");
    resetButton.setOnClickListener(new Button.OnClickListener() {
      @Override
      public void onClick(View v) {
        kernelUrl.setText(Kernel.defaultLocalKernelUrl());
      }
    });

    mLinearLayout.addView(resetButton);
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
