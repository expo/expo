package expo.modules.updates;

import android.net.Uri;

import org.junit.Assert;
import org.junit.Test;

import expo.modules.updates.db.entity.AssetEntity;

import static org.mockito.Mockito.*;

public class UpdatesUtilsTest {
  @Test
  public void testCreateFilenameForAsset() {
    AssetEntity assetEntity = new AssetEntity("key", "png");
    Assert.assertEquals("key", UpdatesUtils.createFilenameForAsset(assetEntity));

    // For assets with a non-null `url` field, we use the SHA-256 hash of the url as the filename.
    // This is for compatibility with older versions of expo-updates without needing to do database
    // migrations.
    Uri mockedUri = mock(Uri.class);
    when(mockedUri.toString()).thenReturn("https://exp.host/test/url");
    assetEntity.url = mockedUri;
    Assert.assertEquals(
      "276DA8F0D751F20A0A8774C7FD5576D80576376634AA84AB3F778166CB52A9AA.png",
      UpdatesUtils.createFilenameForAsset(assetEntity));
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
