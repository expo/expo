package expo.modules.google.signin;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import expo.core.ExportedModule;
import expo.core.BasePackage;

public class GoogleSignInPackage extends BasePackage {
    @Override
    public List<ExportedModule> createExportedModules(Context context) {
        return Collections.singletonList((ExportedModule) new GoogleSignInModule(context));
    }
}