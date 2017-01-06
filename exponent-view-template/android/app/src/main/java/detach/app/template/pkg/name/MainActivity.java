package detach.app.template.pkg.name;

import com.facebook.react.ReactPackage;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import host.exp.exponentview.ExponentActivity;

public class MainActivity extends ExponentActivity {

  @Override
  public String initialUrl() {
    return "TEMPLATE_INITIAL_URL";
  }

  @Override
  public List<String> sdkVersions() {
    return new ArrayList<>(Arrays.asList("13.0.0"));
  }

  @Override
  public List<ReactPackage> reactPackages() {
    return ((MainApplication) getApplication()).getPackages();
  }

  @Override
  public boolean isDebug() {
    return BuildConfig.DEBUG;
  }
}
