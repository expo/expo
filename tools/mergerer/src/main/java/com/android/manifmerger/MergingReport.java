/*
 * Copyright (C) 2014 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.android.manifmerger;

import com.android.annotations.NonNull;
import com.android.annotations.VisibleForTesting;
import com.android.annotations.concurrency.Immutable;
import com.android.ide.common.blame.SourceFile;
import com.android.ide.common.blame.SourceFilePosition;
import com.android.ide.common.blame.SourcePosition;
import com.android.utils.ILogger;
import com.google.common.base.CaseFormat;
import com.google.common.base.Optional;
import com.google.common.collect.ImmutableList;

/**
 * Contains the result of 2 files merging.
 *
 * TODO: more work necessary, this is pretty raw as it stands.
 */
@Immutable
public class MergingReport {

  private final Optional<XmlDocument> mMergedDocument;
  private final Result mResult;
  // list of logging events, ordered by their recording time.
  private final ImmutableList<Record> mRecords;
  private final ImmutableList<String> mIntermediaryStages;
  private final Actions mActions;

  private MergingReport(Optional<XmlDocument> mergedDocument,
      @NonNull Result result,
      @NonNull ImmutableList<Record> records,
      @NonNull ImmutableList<String> intermediaryStages,
      @NonNull Actions actions) {
    mMergedDocument = mergedDocument;
    mResult = result;
    mRecords = records;
    mIntermediaryStages = intermediaryStages;
    mActions = actions;
  }

  /**
   * dumps all logging records to a logger.
   */
  public void log(ILogger logger) {
    for (Record record : mRecords) {
      switch (record.mSeverity) {
        case WARNING:
          logger.warning(record.toString());
          break;
        case ERROR:
          logger.error(null /* throwable */, record.toString());
          break;
        case INFO:
          logger.verbose(record.toString());
          break;
        default:
          logger.error(null /* throwable */, "Unhandled record type " + record.mSeverity);
      }
    }
    mActions.log(logger);
  }

  /**
   * Return the resulting merged document.
   */
  public Optional<XmlDocument> getMergedDocument() {
    return mMergedDocument;
  }

  /**
   * Returns all the merging intermediary stages if {@link com.android.manifmerger.ManifestMerger2.Invoker.Feature#KEEP_INTERMEDIARY_STAGES}
   * is set.
   */
  public ImmutableList<String> getIntermediaryStages() {
    return mIntermediaryStages;
  }

  @NonNull
  public Result getResult() {
    return mResult;
  }

  @NonNull
  public ImmutableList<Record> getLoggingRecords() {
    return mRecords;
  }

  @NonNull
  public Actions getActions() {
    return mActions;
  }

  @NonNull
  public String getReportString() {
    switch (mResult) {
      case SUCCESS:
        return "Manifest merger executed successfully";
      case WARNING:
        return mRecords.size() > 1
            ? "Manifest merger exited with warnings, see logs"
            : "Manifest merger warning : " + mRecords.get(0).mLog;
      case ERROR:
        return mRecords.size() > 1
            ? "Manifest merger failed with multiple errors, see logs"
            : "Manifest merger failed : " + mRecords.get(0).mLog;
      default:
        return "Manifest merger returned an invalid result " + mResult;
    }
  }

  /**
   * Overall result of the merging process.
   */
  public enum Result {
    SUCCESS,

    WARNING,

    ERROR;

    public boolean isSuccess() {
      return this == SUCCESS || this == WARNING;
    }

    public boolean isWarning() {
      return this == WARNING;
    }

    public boolean isError() {
      return this == ERROR;
    }
  }

  /**
   * Log record. This is used to give users some information about what is happening and what might
   * have gone wrong.
   */
  public static class Record {

    private final Severity mSeverity;
    private final String mLog;
    private final SourceFilePosition mSourceLocation;
    private Record(
        @NonNull SourceFilePosition sourceLocation,
        @NonNull Severity severity,
        @NonNull String mLog) {
      this.mSourceLocation = sourceLocation;
      this.mSeverity = severity;
      this.mLog = mLog;
    }

    public Severity getSeverity() {
      return mSeverity;
    }

    public String getMessage() {
      return mLog;
    }

    @Override
    public String toString() {
      return mSourceLocation.toString() // needs short string.
          + " "
          + CaseFormat.UPPER_UNDERSCORE.to(CaseFormat.UPPER_CAMEL, mSeverity.toString())
          + ":\n\t"
          + mLog;
    }

    public enum Severity {WARNING, ERROR, INFO}
  }

  /**
   * This builder is used to accumulate logging, action recording and intermediary results as well
   * as final result of the merging activity.
   *
   * Once the merging is finished, the {@link #build()} is called to return an immutable version of
   * itself with all the logging, action recordings and xml files obtainable.
   */
  static class Builder {

    private final ILogger mLogger;
    private Optional<XmlDocument> mMergedDocument = Optional.absent();
    private ImmutableList.Builder<Record> mRecordBuilder = new ImmutableList.Builder<Record>();
    private ImmutableList.Builder<String> mIntermediaryStages = new ImmutableList.Builder<String>();
    private boolean mHasWarnings = false;
    private boolean mHasErrors = false;
    private ActionRecorder mActionRecorder = new ActionRecorder();

    Builder(ILogger logger) {
      mLogger = logger;
    }

    Builder setMergedDocument(@NonNull XmlDocument mergedDocument) {
      mMergedDocument = Optional.of(mergedDocument);
      return this;
    }

    @VisibleForTesting Builder addMessage(@NonNull SourceFile sourceFile,
        int line,
        int column,
        @NonNull Record.Severity severity,
        @NonNull String message) {
      // The line and column used are 1-based, but SourcePosition uses zero-based.
      return addMessage(
          new SourceFilePosition(sourceFile, new SourcePosition(line - 1, column - 1, -1)),
          severity,
          message);
    }

    Builder addMessage(@NonNull SourceFile sourceFile,
        @NonNull Record.Severity severity,
        @NonNull String message) {
      return addMessage(
          new SourceFilePosition(sourceFile, SourcePosition.UNKNOWN),
          severity,
          message);
    }

    Builder addMessage(@NonNull SourceFilePosition sourceFilePosition,
        @NonNull Record.Severity severity,
        @NonNull String message) {
      switch (severity) {
        case ERROR:
          mHasErrors = true;
          break;
        case WARNING:
          mHasWarnings = true;
          break;
      }
      mRecordBuilder.add(new Record(sourceFilePosition, severity, message));
      return this;
    }

    Builder addMergingStage(String xml) {
      mIntermediaryStages.add(xml);
      return this;
    }

    /**
     * Returns true if some fatal errors were reported.
     */
    boolean hasErrors() {
      return mHasErrors;
    }

    ActionRecorder getActionRecorder() {
      return mActionRecorder;
    }

    MergingReport build() {
      Result result = mHasErrors
          ? Result.ERROR
          : mHasWarnings
              ? Result.WARNING
              : Result.SUCCESS;

      return new MergingReport(
          mMergedDocument,
          result,
          mRecordBuilder.build(),
          mIntermediaryStages.build(),
          mActionRecorder.build());
    }

    public ILogger getLogger() {
      return mLogger;
    }
  }
}
