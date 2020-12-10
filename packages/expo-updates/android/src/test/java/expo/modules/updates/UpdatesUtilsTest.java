package expo.modules.updates;

import android.net.Uri;

import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.runners.MockitoJUnitRunner;

import expo.modules.updates.db.entity.AssetEntity;

import static org.mockito.Mockito.*;

@RunWith(MockitoJUnitRunner.class)
public class UpdatesUtilsTest {
  @Test
  public void testCreateFilenameForAsset() {
    AssetEntity assetEntity = new AssetEntity("key", "png");
    Assert.assertEquals("key", UpdatesUtils.createFilenameForAsset(assetEntity));
  }

  @Test
  public void testGetRuntimeVersion() {
    UpdatesConfiguration sdkOnlyConfig = mock(UpdatesConfiguration.class);
    when(sdkOnlyConfig.getSdkVersion()).thenReturn("38.0.0");
    when(sdkOnlyConfig.getRuntimeVersion()).thenReturn(null);
    Assert.assertEquals("38.0.0", UpdatesUtils.getRuntimeVersion(sdkOnlyConfig));

    UpdatesConfiguration runtimeOnlyConfig = mock(UpdatesConfiguration.class);
    when(runtimeOnlyConfig.getRuntimeVersion()).thenReturn("1.0");
    when(runtimeOnlyConfig.getSdkVersion()).thenReturn(null);
    Assert.assertEquals("1.0", UpdatesUtils.getRuntimeVersion(runtimeOnlyConfig));

    // should prefer runtimeVersion over sdkVersion if both are specified
    UpdatesConfiguration bothConfig = mock(UpdatesConfiguration.class);
    when(bothConfig.getSdkVersion()).thenReturn("38.0.0");
    when(bothConfig.getRuntimeVersion()).thenReturn("1.0");
    Assert.assertEquals("1.0", UpdatesUtils.getRuntimeVersion(bothConfig));
  }

  @Test(expected = AssertionError.class)
  public void testGetRuntimeVersion_neitherDefined() {
    // should throw if neither are specified
    UpdatesConfiguration neitherConfig = mock(UpdatesConfiguration.class);
    when(neitherConfig.getSdkVersion()).thenReturn(null);
    when(neitherConfig.getRuntimeVersion()).thenReturn(null);
    UpdatesUtils.getRuntimeVersion(neitherConfig);
  }
}
