package detach.app.template.pkg.name;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import host.exp.exponentview.ExponentActivity;

public class MainActivity extends ExponentActivity {

  @Override
  public String initialUrl() {
    return "exp://exp.host/@jesse/native-component-list";
  }

  @Override
  public List<String> sdkVersions() {
    return new ArrayList<>(Arrays.asList("12.0.0"));
  }
}
