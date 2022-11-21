package com.swmansion.reanimated.transitions;

import android.animation.Animator;
import android.animation.AnimatorSet;
import android.animation.TimeInterpolator;
import android.view.ViewGroup;
import androidx.annotation.Nullable;
import androidx.transition.ChangeBounds;
import androidx.transition.ChangeTransform;
import androidx.transition.Transition;
import androidx.transition.TransitionPropagation;
import androidx.transition.TransitionValues;

final class ChangeTransition extends Transition {

  private final ChangeTransform mChangeTransform;
  private final ChangeBounds mChangeBounds;

  public ChangeTransition() {
    mChangeTransform = new ChangeTransform();
    mChangeBounds = new ChangeBounds();
  }

  @Override
  public void captureStartValues(TransitionValues transitionValues) {
    mChangeTransform.captureStartValues(transitionValues);
    mChangeBounds.captureStartValues(transitionValues);
  }

  @Override
  public void captureEndValues(TransitionValues transitionValues) {
    mChangeTransform.captureEndValues(transitionValues);
    mChangeBounds.captureEndValues(transitionValues);
  }

  @Override
  public Transition setDuration(long duration) {
    mChangeTransform.setDuration(duration);
    mChangeBounds.setDuration(duration);
    return super.setDuration(duration);
  }

  @Override
  public Transition setStartDelay(long startDelay) {
    mChangeTransform.setStartDelay(startDelay);
    mChangeBounds.setStartDelay(startDelay);
    return super.setStartDelay(startDelay);
  }

  @Override
  public Transition setInterpolator(@Nullable TimeInterpolator interpolator) {
    mChangeTransform.setInterpolator(interpolator);
    mChangeBounds.setInterpolator(interpolator);
    return super.setInterpolator(interpolator);
  }

  @Override
  public void setPropagation(@Nullable TransitionPropagation transitionPropagation) {
    mChangeTransform.setPropagation(transitionPropagation);
    mChangeBounds.setPropagation(transitionPropagation);
    super.setPropagation(transitionPropagation);
  }

  @Override
  public Animator createAnimator(
      ViewGroup sceneRoot, TransitionValues startValues, TransitionValues endValues) {
    mChangeTransform.setReparent(false);
    Animator changeTransformAnimator =
        mChangeTransform.createAnimator(sceneRoot, startValues, endValues);
    Animator changeBoundsAnimator = mChangeBounds.createAnimator(sceneRoot, startValues, endValues);

    if (changeTransformAnimator == null) {
      return changeBoundsAnimator;
    }

    if (changeBoundsAnimator == null) {
      return changeTransformAnimator;
    }

    AnimatorSet animatorSet = new AnimatorSet();
    animatorSet.playTogether(changeTransformAnimator, changeBoundsAnimator);
    return animatorSet;
  }
}
