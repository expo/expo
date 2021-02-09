package expo.modules.updates;

import android.net.Uri;

import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.runners.MockitoJUnitRunner;

import static org.mockito.Mockito.*;

@RunWith(MockitoJUnitRunner.class)
public class UpdatesConfigurationTest {
  @Test
  public void testGetNormalizedUrlOrigin_NoPort() {
    Uri mockedUri = mock(Uri.class);
    when(mockedUri.getScheme()).thenReturn("https");
    when(mockedUri.getHost()).thenReturn("exp.host");
    when(mockedUri.getPort()).thenReturn(-1);

    Assert.assertEquals("https://exp.host", UpdatesConfiguration.getNormalizedUrlOrigin(mockedUri));
  }

  @Test
  public void testGetNormalizedUrlOrigin_DefaultPort() {
    Uri mockedUri = mock(Uri.class);
    when(mockedUri.getScheme()).thenReturn("https");
    when(mockedUri.getHost()).thenReturn("exp.host");
    when(mockedUri.getPort()).thenReturn(443);

    Assert.assertEquals("https://exp.host", UpdatesConfiguration.getNormalizedUrlOrigin(mockedUri));
  }

  @Test
  public void testGetNormalizedUrlOrigin_OtherPort() {
    Uri mockedUri = mock(Uri.class);
    when(mockedUri.getScheme()).thenReturn("https");
    when(mockedUri.getHost()).thenReturn("exp.host");
    when(mockedUri.getPort()).thenReturn(47);

    Assert.assertEquals("https://exp.host:47", UpdatesConfiguration.getNormalizedUrlOrigin(mockedUri));
  }
}
