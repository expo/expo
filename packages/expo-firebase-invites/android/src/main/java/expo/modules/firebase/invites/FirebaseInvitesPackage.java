package expo.modules.firebase.invites;

    import android.content.Context;

    import java.util.Collections;
    import java.util.List;

    import expo.core.BasePackage;
    import expo.core.ExportedModule;

@SuppressWarnings("unused")
public class FirebaseInvitesPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.singletonList((ExportedModule) new FirebaseInvitesModule(context));
  }
}
