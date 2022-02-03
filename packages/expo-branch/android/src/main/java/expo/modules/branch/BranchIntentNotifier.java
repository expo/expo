package expo.modules.branch;

import android.app.Activity;
import android.content.Intent;

import expo.modules.core.interfaces.ActivityEventListener;
import expo.modules.core.interfaces.InternalModule;

import java.util.Collections;
import java.util.List;

import io.branch.rnbranch.RNBranchModule;

public class BranchIntentNotifier implements InternalModule, ActivityEventListener {
  @Override
  public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
    // do nothing
  }

  @Override
  public void onNewIntent(Intent intent) {
    RNBranchModule.onNewIntent(intent);
  }

  @Override
  public List<? extends Class> getExportedInterfaces() {
    return Collections.singletonList(BranchIntentNotifier.class);
  }
}
