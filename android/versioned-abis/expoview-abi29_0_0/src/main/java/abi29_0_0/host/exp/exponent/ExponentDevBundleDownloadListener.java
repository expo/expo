package abi29_0_0.host.exp.exponent;

import abi29_0_0.com.facebook.react.devsupport.interfaces.DevBundleDownloadListener;

import javax.annotation.Nullable;

import host.exp.exponent.experience.DevBundleDownloadProgressListener;

/**
 * Acts as a bridge between the versioned DevBundleDownloadListener and unversioned
 * DevBundleDownloadProgressListener
 */
public class ExponentDevBundleDownloadListener implements DevBundleDownloadListener {
  private DevBundleDownloadProgressListener mListener;

  public ExponentDevBundleDownloadListener(DevBundleDownloadProgressListener listener) {
    mListener = listener;
  }

  @Override
  public void onSuccess() {
    mListener.onSuccess();
  }

  @Override
  public void onProgress(@Nullable String status, @Nullable Integer done, @Nullable Integer total) {
    mListener.onProgress(status, done, total);
  }

  @Override
  public void onFailure(Exception cause) {
    mListener.onFailure(cause);
  }
}
