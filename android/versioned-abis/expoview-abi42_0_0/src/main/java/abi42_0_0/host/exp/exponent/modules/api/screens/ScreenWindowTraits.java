package abi42_0_0.host.exp.exponent.modules.api.screens;

import android.animation.ArgbEvaluator;
import android.animation.ValueAnimator;
import android.annotation.TargetApi;
import android.app.Activity;
import android.content.pm.ActivityInfo;
import android.os.Build;
import android.view.View;
import android.view.ViewParent;
import android.view.WindowInsets;
import android.view.WindowManager;

import androidx.annotation.Nullable;
import androidx.core.view.ViewCompat;

import abi42_0_0.com.facebook.react.bridge.GuardedRunnable;
import abi42_0_0.com.facebook.react.bridge.ReactContext;
import abi42_0_0.com.facebook.react.bridge.UiThreadUtil;

public class ScreenWindowTraits {
  // Methods concerning statusBar management were taken from `react-native`'s status bar module:
  // https://github.com/facebook/react-native/blob/master/ReactAndroid/src/main/java/com/facebook/react/modules/statusbar/StatusBarModule.java

  private static boolean mDidSetOrientation = false;
  private static boolean mDidSetStatusBarAppearance = false;
  private static Integer mDefaultStatusBarColor = null;

  protected static void applyDidSetOrientation() {
    mDidSetOrientation = true;
  }

  public static boolean didSetOrientation() {
    return mDidSetOrientation;
  }

  protected static void applyDidSetStatusBarAppearance() {
    mDidSetStatusBarAppearance = true;
  }

  public static boolean didSetStatusBarAppearance() {
    return mDidSetStatusBarAppearance;
  }

  protected static void setOrientation(Screen screen, final Activity activity) {
    if (activity == null) {
      return;
    }

    Screen screenForOrientation =  ScreenWindowTraits.findScreenForTrait(screen, Screen.WindowTraits.ORIENTATION);

    final Integer orientation;

    if (screenForOrientation != null && screenForOrientation.getScreenOrientation() != null) {
      orientation = screenForOrientation.getScreenOrientation();
    } else {
      orientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED;
    }

    activity.setRequestedOrientation(orientation);
  }

  protected static void setColor(Screen screen, final Activity activity, ReactContext context) {
    if (activity == null || context == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
      return;
    }

    if (mDefaultStatusBarColor == null) {
      mDefaultStatusBarColor = activity.getWindow().getStatusBarColor();
    }

    Screen screenForColor = ScreenWindowTraits.findScreenForTrait(screen, Screen.WindowTraits.COLOR);
    Screen screenForAnimated = ScreenWindowTraits.findScreenForTrait(screen, Screen.WindowTraits.ANIMATED);

    final Integer color;
    final boolean animated;

    if (screenForColor != null && screenForColor.getStatusBarColor() != null) {
      color = screenForColor.getStatusBarColor();
    } else {
      color = mDefaultStatusBarColor;
    }

    if (screenForAnimated != null && screenForAnimated.isStatusBarAnimated() != null) {
      animated = screenForAnimated.isStatusBarAnimated();
    } else {
      animated = false;
    }

    UiThreadUtil.runOnUiThread(
            new GuardedRunnable(context) {
              @TargetApi(Build.VERSION_CODES.LOLLIPOP)
              @Override
              public void runGuarded() {
                activity
                        .getWindow()
                        .addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
                int curColor = activity.getWindow().getStatusBarColor();
                ValueAnimator colorAnimation =
                        ValueAnimator.ofObject(new ArgbEvaluator(), curColor, color);
                colorAnimation.addUpdateListener(
                        new ValueAnimator.AnimatorUpdateListener() {
                          @Override
                          public void onAnimationUpdate(ValueAnimator animator) {
                            activity.getWindow().setStatusBarColor((Integer) animator.getAnimatedValue());
                          }
                        });

                if (animated) {
                  colorAnimation.setDuration(300).setStartDelay(0);
                } else {
                  colorAnimation.setDuration(0).setStartDelay(300);
                }
                colorAnimation.start();
              }
            });
  }

  protected static void setStyle(Screen screen, final Activity activity, ReactContext context) {
    if (activity == null || context == null) {
      return;
    }

    Screen screenForStyle =  ScreenWindowTraits.findScreenForTrait(screen, Screen.WindowTraits.STYLE);

    final String style;

    if (screenForStyle != null && screenForStyle.getStatusBarStyle() != null) {
      style = screenForStyle.getStatusBarStyle();
    } else {
      style = "light";
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      UiThreadUtil.runOnUiThread(
              new Runnable() {
                @TargetApi(Build.VERSION_CODES.M)
                @Override
                public void run() {
                  View decorView = activity.getWindow().getDecorView();
                  int systemUiVisibilityFlags = decorView.getSystemUiVisibility();
                  if ("dark".equals(style)) {
                    systemUiVisibilityFlags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                  } else {
                    systemUiVisibilityFlags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                  }
                  decorView.setSystemUiVisibility(systemUiVisibilityFlags);
                }
              });
    }
  }

  protected static void setTranslucent(Screen screen, final Activity activity, ReactContext context) {
    if (activity == null || context == null) {
      return;
    }

    final boolean translucent;

    Screen screenForTranslucent = ScreenWindowTraits.findScreenForTrait(screen, Screen.WindowTraits.TRANSLUCENT);

    if (screenForTranslucent != null && screenForTranslucent.isStatusBarTranslucent() != null) {
      translucent = screenForTranslucent.isStatusBarTranslucent();
    } else {
      translucent = false;
    }

    UiThreadUtil.runOnUiThread(
            new GuardedRunnable(context) {
              @TargetApi(Build.VERSION_CODES.LOLLIPOP)
              @Override
              public void runGuarded() {
                // If the status bar is translucent hook into the window insets calculations
                // and consume all the top insets so no padding will be added under the status bar.
                View decorView = activity.getWindow().getDecorView();
                if (translucent) {
                  decorView.setOnApplyWindowInsetsListener(
                          new View.OnApplyWindowInsetsListener() {
                            @Override
                            public WindowInsets onApplyWindowInsets(View v, WindowInsets insets) {
                              WindowInsets defaultInsets = v.onApplyWindowInsets(insets);
                              return defaultInsets.replaceSystemWindowInsets(
                                      defaultInsets.getSystemWindowInsetLeft(),
                                      0,
                                      defaultInsets.getSystemWindowInsetRight(),
                                      defaultInsets.getSystemWindowInsetBottom());
                            }
                          });
                } else {
                  decorView.setOnApplyWindowInsetsListener(null);
                }

                ViewCompat.requestApplyInsets(decorView);
              }
            });
  }

  protected static void setHidden(Screen screen, final Activity activity) {
    if (activity == null) {
      return;
    }

    final boolean hidden;

    Screen screenForHidden = ScreenWindowTraits.findScreenForTrait(screen, Screen.WindowTraits.HIDDEN);

    if (screenForHidden != null && screenForHidden.isStatusBarHidden() != null) {
      hidden = screenForHidden.isStatusBarHidden();
    } else {
      hidden = false;
    }

    UiThreadUtil.runOnUiThread(
            new Runnable() {
              @Override
              public void run() {
                if (hidden) {
                  activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
                  activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN);
                } else {
                  activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN);
                  activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
                }
              }
            });
  }

  protected static void trySetWindowTraits(Screen screen, Activity activity, ReactContext context) {
    if (ScreenWindowTraits.didSetOrientation()) {
      ScreenWindowTraits.setOrientation(screen, activity);
    }
    if (ScreenWindowTraits.didSetStatusBarAppearance()) {
      ScreenWindowTraits.setColor(screen, activity, context);
      ScreenWindowTraits.setStyle(screen, activity, context);
      ScreenWindowTraits.setTranslucent(screen, activity, context);
      ScreenWindowTraits.setHidden(screen, activity);
    }
  }

  protected static Screen findScreenForTrait(Screen screen, Screen.WindowTraits trait) {
    Screen childWithTrait = childScreenWithTraitSet(screen, trait);
    if (childWithTrait != null) {
      return childWithTrait;
    }

    if (checkTraitForScreen(screen, trait)) {
      return screen;
    } else {
      // if there is no child with trait set and this screen has no trait set, we look for a parent that has the trait set
      return findParentWithTraitSet(screen, trait);
    }
  }

  private static @Nullable Screen findParentWithTraitSet(Screen screen, Screen.WindowTraits trait) {
    ViewParent parent = screen.getContainer();
    while (parent != null) {
      if (parent instanceof Screen) {
        if (checkTraitForScreen((Screen) parent, trait)) {
          return (Screen) parent;
        }
      }
      parent = parent.getParent();
    }
    return null;
  }

  protected static @Nullable Screen childScreenWithTraitSet(Screen screen, Screen.WindowTraits trait) {
    if (screen == null || screen.getFragment() == null) {
      return null;
    }
    for (ScreenContainer sc : screen.getFragment().getChildScreenContainers()) {
      // we check only the top screen for the trait
      Screen topScreen = sc.getTopScreen();
      Screen child = childScreenWithTraitSet(topScreen, trait);
      if (child != null) {
        return child;
      }
      if (topScreen != null && checkTraitForScreen(topScreen, trait)) {
        return topScreen;
      }
    }
    return null;
  }

  private static boolean checkTraitForScreen(Screen screen, Screen.WindowTraits trait) {
    switch (trait) {
      case ORIENTATION:
        return screen.getScreenOrientation() != null;
      case COLOR:
        return screen.getStatusBarColor() != null;
      case STYLE:
        return screen.getStatusBarStyle() != null;
      case TRANSLUCENT:
        return screen.isStatusBarTranslucent() != null;
      case HIDDEN:
        return screen.isStatusBarHidden() != null;
      case ANIMATED:
        return screen.isStatusBarAnimated() != null;
      default:
        throw new IllegalArgumentException("Wrong trait passed: " + trait);
    }
  }

}
