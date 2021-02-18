package expo.modules.updates.loader;

import android.content.Context;
import android.net.Uri;

import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.HashMap;

import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner;
import androidx.test.platform.app.InstrumentationRegistry;
import expo.modules.updates.UpdatesConfiguration;
import okhttp3.Request;

@RunWith(AndroidJUnit4ClassRunner.class)
public class FileDownloaderTest {

  private Context context;

  @Before
  public void setup() {
    context = InstrumentationRegistry.getInstrumentation().getTargetContext();
  }

  @Test
  public void testCacheControl_LegacyManifest() {
    HashMap<String, Object> configMap = new HashMap<>();
    configMap.put("updateUrl", Uri.parse("https://exp.host/@test/test"));
    configMap.put("runtimeVersion", "1.0");
    configMap.put("usesLegacyManifest", true);
    UpdatesConfiguration config = new UpdatesConfiguration().loadValuesFromMap(configMap);

    Request actual = FileDownloader.setHeadersForManifestUrl(config, context);
    Assert.assertEquals("no-cache", actual.header("Cache-Control"));
  }

  @Test
  public void testCacheControl_NewManifest() {
    HashMap<String, Object> configMap = new HashMap<>();
    configMap.put("updateUrl", Uri.parse("https://exp.host/@test/test"));
    configMap.put("runtimeVersion", "1.0");
    configMap.put("usesLegacyManifest", false);
    UpdatesConfiguration config = new UpdatesConfiguration().loadValuesFromMap(configMap);

    Request actual = FileDownloader.setHeadersForManifestUrl(config, context);
    Assert.assertNull(actual.header("Cache-Control"));
  }
}
