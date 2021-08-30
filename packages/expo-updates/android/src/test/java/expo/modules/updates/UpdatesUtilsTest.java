package expo.modules.updates;

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
    AssetEntity assetEntity = new AssetEntity("key", ".png");
    Assert.assertEquals("key.png", UpdatesUtils.createFilenameForAsset(assetEntity));
  }

  @Test
  public void testCreateFilenameForAssetWhenMissingDotPrefix() {
    AssetEntity assetEntity = new AssetEntity("key", "png");
    Assert.assertEquals("key.png", UpdatesUtils.createFilenameForAsset(assetEntity));
  }

  @Test
  public void testCreateFilenameForAssetWhenMissingExtension() {
    AssetEntity assetEntity = new AssetEntity("key", null);
    Assert.assertEquals("key", UpdatesUtils.createFilenameForAsset(assetEntity));
  }

  @Test
  public void testCreateFilenameForAsset_NullKey() {
    // asset filenames with null keys should be unique
    AssetEntity asset1 = new AssetEntity(null, "bundle");
    AssetEntity asset2 = new AssetEntity(null, "bundle");
    Assert.assertNotEquals(UpdatesUtils.createFilenameForAsset(asset1), UpdatesUtils.createFilenameForAsset(asset2));

    String asset1Name = UpdatesUtils.createFilenameForAsset(asset1);
    Assert.assertEquals(asset1Name.substring(asset1Name.length()-7),".bundle");
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

  @Test
  public void testGetRuntimeVersion_neitherDefined() {
    UpdatesConfiguration neitherConfig = mock(UpdatesConfiguration.class);
    when(neitherConfig.getSdkVersion()).thenReturn(null);
    when(neitherConfig.getRuntimeVersion()).thenReturn(null);
    Assert.assertEquals("1", UpdatesUtils.getRuntimeVersion(neitherConfig));
  }
}
