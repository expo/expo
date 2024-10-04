package abi46_0_0.expo.modules.videothumbnails;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import abi46_0_0.expo.modules.core.BasePackage;
import abi46_0_0.expo.modules.core.ExportedModule;
import abi46_0_0.expo.modules.core.ViewManager;

public class VideoThumbnailsPackage extends BasePackage {
    @Override
    public List<ExportedModule> createExportedModules(Context context) {
        return Collections.singletonList((ExportedModule) new VideoThumbnailsModule(context));
    }
}
