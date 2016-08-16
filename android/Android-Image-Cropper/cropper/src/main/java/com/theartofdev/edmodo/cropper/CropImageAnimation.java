// "Therefore those skilled at the unorthodox
// are infinite as heaven and earth,
// inexhaustible as the great rivers.
// When they come to an end,
// they begin again,
// like the days and months;
// they die and are reborn,
// like the four seasons."
//
// - Sun Tsu,
// "The Art of War"

package com.theartofdev.edmodo.cropper;

import android.graphics.Matrix;
import android.graphics.RectF;
import android.view.animation.AccelerateDecelerateInterpolator;
import android.view.animation.Animation;
import android.view.animation.Transformation;
import android.widget.ImageView;

/**
 * Animation to handle smooth cropping image matrix transformation change, specifically for zoom-in/out.
 */
final class CropImageAnimation extends Animation implements Animation.AnimationListener {

    //region: Fields and Consts

    private final ImageView mImageView;

    private final CropOverlayView mCropOverlayView;

    private final RectF mStartImageRect = new RectF();

    private final RectF mEndImageRect = new RectF();

    private final RectF mStartCropWindowRect = new RectF();

    private final RectF mEndCropWindowRect = new RectF();

    private final float[] mStartImageMatrix = new float[9];

    private final float[] mEndImageMatrix = new float[9];

    private final RectF mAnimRect = new RectF();

    private final float[] mAnimMatrix = new float[9];
    //endregion

    public CropImageAnimation(ImageView cropImageView, CropOverlayView cropOverlayView) {
        mImageView = cropImageView;
        mCropOverlayView = cropOverlayView;

        setDuration(300);
        setFillAfter(true);
        setInterpolator(new AccelerateDecelerateInterpolator());
        setAnimationListener(this);
    }

    public void setStartState(RectF imageRect, Matrix imageMatrix) {
        reset();
        mStartImageRect.set(imageRect);
        mStartCropWindowRect.set(mCropOverlayView.getCropWindowRect());
        imageMatrix.getValues(mStartImageMatrix);
    }

    public void setEndState(RectF imageRect, Matrix imageMatrix) {
        mEndImageRect.set(imageRect);
        mEndCropWindowRect.set(mCropOverlayView.getCropWindowRect());
        imageMatrix.getValues(mEndImageMatrix);
    }

    @Override
    protected void applyTransformation(float interpolatedTime, Transformation t) {

        mAnimRect.left = mStartCropWindowRect.left + (mEndCropWindowRect.left - mStartCropWindowRect.left) * interpolatedTime;
        mAnimRect.top = mStartCropWindowRect.top + (mEndCropWindowRect.top - mStartCropWindowRect.top) * interpolatedTime;
        mAnimRect.right = mStartCropWindowRect.right + (mEndCropWindowRect.right - mStartCropWindowRect.right) * interpolatedTime;
        mAnimRect.bottom = mStartCropWindowRect.bottom + (mEndCropWindowRect.bottom - mStartCropWindowRect.bottom) * interpolatedTime;
        mCropOverlayView.setCropWindowRect(mAnimRect);

        mAnimRect.left = mStartImageRect.left + (mEndImageRect.left - mStartImageRect.left) * interpolatedTime;
        mAnimRect.top = mStartImageRect.top + (mEndImageRect.top - mStartImageRect.top) * interpolatedTime;
        mAnimRect.right = mStartImageRect.right + (mEndImageRect.right - mStartImageRect.right) * interpolatedTime;
        mAnimRect.bottom = mStartImageRect.bottom + (mEndImageRect.bottom - mStartImageRect.bottom) * interpolatedTime;
        mCropOverlayView.setBitmapRect(mAnimRect, mImageView.getWidth(), mImageView.getHeight());

        for (int i = 0; i < mAnimMatrix.length; i++) {
            mAnimMatrix[i] = mStartImageMatrix[i] + (mEndImageMatrix[i] - mStartImageMatrix[i]) * interpolatedTime;
        }
        Matrix m = mImageView.getImageMatrix();
        m.setValues(mAnimMatrix);
        mImageView.setImageMatrix(m);

        mImageView.invalidate();
        mCropOverlayView.invalidate();
    }

    @Override
    public void onAnimationStart(Animation animation) {

    }

    @Override
    public void onAnimationEnd(Animation animation) {
        mImageView.clearAnimation();
    }

    @Override
    public void onAnimationRepeat(Animation animation) {

    }
}

