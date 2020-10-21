package expo.modules.developmentclient;

import android.app.Application;

import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;

import org.apache.commons.io.IOUtils;
import org.unimodules.adapters.react.ModuleRegistryAdapter;
import org.unimodules.adapters.react.ReactModuleRegistryProvider;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.List;

import androidx.annotation.Nullable;
import expo.modules.barcodescanner.BarCodeScannerPackage;

public class DevelopmentClientHost extends ReactNativeHost {
  private boolean mUseDeveloperSupport;

  private final ReactModuleRegistryProvider mModuleRegistryProvider = new ReactModuleRegistryProvider(
    Arrays.asList(new BarCodeScannerPackage())
  );

  protected DevelopmentClientHost(Application application, boolean useDeveloperSupport) {
    super(application);
    mUseDeveloperSupport = useDeveloperSupport;
  }

  @Override
  public boolean getUseDeveloperSupport() {
    return mUseDeveloperSupport;
  }

  @Override
  protected List<ReactPackage> getPackages() {
    return Arrays.asList(
      new MainReactPackage(null),
      new DevelopmentClientPackage(),
      new ModuleRegistryAdapter(mModuleRegistryProvider));
  }

  @Nullable
  @Override
  protected String getJSBundleFile() {
    // React Native needs an actual file path, while the embedded bundle is a 'raw resource' which
    // doesn't have a true file path. So we write it out to a temporary file then return a path
    // to that file.
    File bundle = new File(getApplication().getCacheDir().getAbsolutePath() + "/expo_development_client_android.bundle");
    try {
      // TODO(nikki): We could cache this? Biasing toward always using latest for now...
      FileOutputStream output = new FileOutputStream(bundle);
      InputStream input = getApplication().getResources().openRawResource(R.raw.expo_development_client_android);
      IOUtils.copy(input, output);
      output.close();
      return bundle.getAbsolutePath();
    } catch (IOException e) {
      return null;
    }
  }
}
