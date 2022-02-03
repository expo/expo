package abi42_0_0.expo.modules.videothumbnails;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import abi42_0_0.org.unimodules.core.BasePackage;
import abi42_0_0.org.unimodules.core.ExportedModule;
import abi42_0_0.org.unimodules.core.ViewManager;

public class VideoThumbnailsPackage extends BasePackage {
    @Override
    public List<ExportedModule> createExportedModules(Context context) {
        return Collections.singletonList((ExportedModule) new VideoThumbnailsModule(context));
    }
}
