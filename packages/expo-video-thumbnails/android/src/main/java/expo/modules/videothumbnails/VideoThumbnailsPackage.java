package expo.modules.videothumbnails;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import expo.modules.core.BasePackage;
import expo.modules.core.ExportedModule;
import expo.modules.core.ViewManager;

public class VideoThumbnailsPackage extends BasePackage {
    @Override
    public List<ExportedModule> createExportedModules(Context context) {
        return Collections.singletonList((ExportedModule) new VideoThumbnailsModule(context));
    }
}
