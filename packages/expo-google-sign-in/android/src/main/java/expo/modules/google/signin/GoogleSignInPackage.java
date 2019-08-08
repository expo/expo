package expo.modules.google.signin;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.BasePackage;

public class GoogleSignInPackage extends BasePackage {
    @Override
    public List<ExportedModule> createExportedModules(Context context) {
        return Collections.singletonList((ExportedModule) new GoogleSignInModule(context));
    }
}
