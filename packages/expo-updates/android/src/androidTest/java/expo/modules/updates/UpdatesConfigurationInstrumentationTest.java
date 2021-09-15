package expo.modules.updates;

import android.content.Context;
import org.junit.Assert;
import org.junit.Test;
import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;

import androidx.test.core.app.ApplicationProvider;

import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.runners.MockitoJUnitRunner;

import static org.mockito.Mockito.*;

@RunWith(MockitoJUnitRunner.class)
public class UpdatesConfigurationInstrumentationTest {
    String packageName = "test";
    String runtimeVersion = "3.14";

    @Test
    public void testLoadValuesFromMetadata_stripsPrefix() throws PackageManager.NameNotFoundException {
        Bundle metaData = new Bundle();
        metaData.putString("expo.modules.updates.EXPO_RUNTIME_VERSION",String.format("string:%s",runtimeVersion) );

        ApplicationInfo mockAi = mock(ApplicationInfo.class);
        mockAi.metaData = metaData;

        PackageManager packageManager = mock(PackageManager.class);
        when(packageManager.getApplicationInfo(packageName, PackageManager.GET_META_DATA)).thenReturn(mockAi);

        Context context = mock(Context.class);
        when(context.getPackageName()).thenReturn(packageName);
        when(context.getPackageManager()).thenReturn(packageManager);

        UpdatesConfiguration config = new UpdatesConfiguration();
        config = config.loadValuesFromMetadata(context);

        Assert.assertEquals(runtimeVersion, config.getRuntimeVersion());
    }

    @Test
    public void testLoadValuesFromMetadata_worksWithoutPrefix() throws PackageManager.NameNotFoundException {
        Bundle metaData = new Bundle();
        metaData.putString("expo.modules.updates.EXPO_RUNTIME_VERSION",runtimeVersion);

        ApplicationInfo mockAi = mock(ApplicationInfo.class);
        mockAi.metaData = metaData;

        PackageManager packageManager = mock(PackageManager.class);
        when(packageManager.getApplicationInfo(packageName, PackageManager.GET_META_DATA)).thenReturn(mockAi);


        Context context = mock(Context.class);
        when(context.getPackageName()).thenReturn(packageName);
        when(context.getPackageManager()).thenReturn(packageManager);

        UpdatesConfiguration config = new UpdatesConfiguration();
        config = config.loadValuesFromMetadata(context);

        Assert.assertEquals(runtimeVersion, config.getRuntimeVersion());
    }
}
