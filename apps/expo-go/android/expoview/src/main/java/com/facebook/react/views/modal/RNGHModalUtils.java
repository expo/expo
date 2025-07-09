package com.facebook.react.views.modal;

import android.view.MotionEvent;
import android.view.ViewGroup;
import android.view.ViewParent;

/**
 * For handling gestures inside RNGH we need to have access to some methods of
 * `ReactModalHostView.DialogRootViewGroup`. This class is not available outside
 * package so this file exports important features.
 */

public class RNGHModalUtils {
  public static void dialogRootViewGroupOnChildStartedNativeGesture(ViewGroup modal, MotionEvent androidEvent) {
    ((ReactModalHostView.DialogRootViewGroup) modal).onChildStartedNativeGesture(androidEvent);
  }

  public static boolean isDialogRootViewGroup(ViewParent modal) {
    return modal instanceof ReactModalHostView.DialogRootViewGroup;
  }
}
