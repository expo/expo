package detach.app.template.pkg.name;

import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;

import host.exp.exponentview.Exponent;

public class MainActivity extends AppCompatActivity {

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    Exponent.initialize(this, getApplication());
    setContentView(R.layout.activity_main);
  }
}
