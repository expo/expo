// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.modules.network;

import java.io.IOException;
import javax.annotation.Nullable;

import expolib_v1.okhttp3.MediaType;
import expolib_v1.okhttp3.ResponseBody;
import expolib_v1.okio.Buffer;
import expolib_v1.okio.BufferedSource;
import expolib_v1.okio.ForwardingSource;
import expolib_v1.okio.Okio;
import expolib_v1.okio.Source;

public class ProgressResponseBody extends ResponseBody {

    private final ResponseBody mResponseBody;
    private final ProgressListener mProgressListener;
    private @Nullable BufferedSource mBufferedSource;
    private long mTotalBytesRead;

    public ProgressResponseBody(ResponseBody responseBody, ProgressListener progressListener) {
        this.mResponseBody = responseBody;
        this.mProgressListener = progressListener;
        mTotalBytesRead = 0L;
    }

    @Override
    public MediaType contentType() {
        return mResponseBody.contentType();
    }

    @Override
    public long contentLength() {
        return mResponseBody.contentLength();
    }

    public long totalBytesRead() {
        return mTotalBytesRead;
    }

    @Override public BufferedSource source() {
        if (mBufferedSource == null) {
            mBufferedSource = Okio.buffer(source(mResponseBody.source()));
        }
        return mBufferedSource;
    }

    private Source source(Source source) {
        return new ForwardingSource(source) {
            @Override public long read(Buffer sink, long byteCount) throws IOException {
                long bytesRead = super.read(sink, byteCount);
                // read() returns the number of bytes read, or -1 if this source is exhausted.
                mTotalBytesRead += bytesRead != -1 ? bytesRead : 0;
                mProgressListener.onProgress(
                    mTotalBytesRead, mResponseBody.contentLength(), bytesRead == -1);
                return bytesRead;
            }
        };
    }
}
