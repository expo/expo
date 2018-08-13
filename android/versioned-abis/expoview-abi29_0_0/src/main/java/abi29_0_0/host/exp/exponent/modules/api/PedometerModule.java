// Copyright 2015-present 650 Industries. All rights reserved.

package abi29_0_0.host.exp.exponent.modules.api;

import android.os.AsyncTask;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.v4.app.FragmentActivity;

import abi29_0_0.com.facebook.infer.annotation.Assertions;
import abi29_0_0.com.facebook.react.bridge.Arguments;
import abi29_0_0.com.facebook.react.bridge.Promise;
import abi29_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi29_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi29_0_0.com.facebook.react.bridge.ReactMethod;
import abi29_0_0.com.facebook.react.bridge.WritableMap;
import abi29_0_0.com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.Scopes;
import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.common.api.ResultCallback;
import com.google.android.gms.common.api.Scope;
import com.google.android.gms.common.api.Status;
import com.google.android.gms.fitness.Fitness;
import com.google.android.gms.fitness.data.Bucket;
import com.google.android.gms.fitness.data.DataPoint;
import com.google.android.gms.fitness.data.DataSet;
import com.google.android.gms.fitness.data.DataSource;
import com.google.android.gms.fitness.data.DataType;
import com.google.android.gms.fitness.data.Field;
import com.google.android.gms.fitness.data.Value;
import com.google.android.gms.fitness.request.DataReadRequest;
import com.google.android.gms.fitness.request.DataSourcesRequest;
import com.google.android.gms.fitness.request.OnDataPointListener;
import com.google.android.gms.fitness.request.SensorRequest;
import com.google.android.gms.fitness.result.DataReadResult;
import com.google.android.gms.fitness.result.DataSourcesResult;

import java.util.concurrent.TimeUnit;

import javax.annotation.Nullable;

public class PedometerModule extends ReactContextBaseJavaModule {
  private @Nullable GoogleApiClient mClient;
  private @Nullable OnDataPointListener mListener;
  private int mWatchTotalSteps = 0;

  public PedometerModule(ReactApplicationContext context) {
    super(context);
  }

  @Override
  public String getName() {
    return "ExponentPedometer";
  }

  public void assertApiClient() {
    if (mClient == null) {
      final FragmentActivity activity = (FragmentActivity) getCurrentActivity();
      mClient = new GoogleApiClient.Builder(getReactApplicationContext())
          .addApi(Fitness.HISTORY_API)
          .addApi(Fitness.SENSORS_API)
          .addApi(Fitness.RECORDING_API)
          .addScope(new Scope(Scopes.FITNESS_ACTIVITY_READ))
          .addConnectionCallbacks(
              new GoogleApiClient.ConnectionCallbacks() {
                @Override
                public void onConnected(Bundle bundle) {
                }

                @Override
                public void onConnectionSuspended(int i) {

                }
              }
          )
          .enableAutoManage(Assertions.assertNotNull(activity), 0, new GoogleApiClient.OnConnectionFailedListener() {
            @Override
            public void onConnectionFailed(@NonNull ConnectionResult connectionResult) {
              // TODO: Figure out how to handle these errors.
            }
          })
          .build();

      Fitness.RecordingApi.subscribe(mClient, DataType.TYPE_STEP_COUNT_DELTA)
          .setResultCallback(new ResultCallback<Status>() {
            @Override
            public void onResult(@NonNull Status status) {
              // TODO: Figure out how to handle these errors.
            }
          });
    }
  }

  @ReactMethod
  public void getStepCountAsync(final double startTime, final double endTime, final Promise promise) {
    assertApiClient();

    AsyncTask.execute(new Runnable() {
      @Override
      public void run() {
        final DataReadRequest req = new DataReadRequest.Builder()
            .aggregate(DataType.AGGREGATE_STEP_COUNT_DELTA, DataType.AGGREGATE_STEP_COUNT_DELTA)
            .bucketByTime(1, TimeUnit.DAYS)
            .setTimeRange((long) startTime, (long) endTime, TimeUnit.MILLISECONDS)
            .build();

        DataReadResult dataReadResult =
            Fitness.HistoryApi.readData(mClient, req).await(1, TimeUnit.MINUTES);

        int steps = 0;
        for (Bucket bucket : dataReadResult.getBuckets()) {
          DataSet ds = bucket.getDataSet(DataType.TYPE_STEP_COUNT_DELTA);
          for (DataPoint dp : ds.getDataPoints()) {
            Value value = dp.getValue(Field.FIELD_STEPS);
            steps += value.asInt();
          }
        }

        WritableMap result = Arguments.createMap();
        result.putInt("steps", steps);
        promise.resolve(result);
      }
    });
  }

  @ReactMethod
  public void watchStepCount() {
    assertApiClient();
    stopWatchingStepCount();

    mWatchTotalSteps = 0;

    mListener = new OnDataPointListener() {
      @Override
      public void onDataPoint(DataPoint dataPoint) {
        Value value = dataPoint.getValue(Field.FIELD_STEPS);
        WritableMap response = Arguments.createMap();
        mWatchTotalSteps += value.asInt();
        response.putInt("steps", mWatchTotalSteps);
        getReactApplicationContext()
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit("Exponent.pedometerUpdate", response);
      }
    };

    Fitness.SensorsApi.add(
        mClient,
        new SensorRequest.Builder()
            .setDataType(DataType.TYPE_STEP_COUNT_DELTA)
            .setSamplingRate(5, TimeUnit.SECONDS)
            .build(),
        mListener);
  }

  @ReactMethod
  public void stopWatchingStepCount() {
    assertApiClient();

    if (mListener != null) {
      Fitness.SensorsApi.remove(mClient, mListener);
    }
  }

  @ReactMethod
  public void isAvailableAsync(final Promise promise) {
    assertApiClient();

    Fitness.SensorsApi.findDataSources(mClient, new DataSourcesRequest.Builder()
        .setDataTypes(DataType.TYPE_STEP_COUNT_DELTA)
        .build())
        .setResultCallback(new ResultCallback<DataSourcesResult>() {
          @Override
          public void onResult(@NonNull DataSourcesResult dataSourcesResult) {
            if (!dataSourcesResult.getStatus().isSuccess()) {
              promise.reject("E_PEDOMETER", "Failed to determine if the pedometer is available.");
              return;
            }
            for (DataSource ds : dataSourcesResult.getDataSources()) {
              if (ds.getDataType().equals(DataType.TYPE_STEP_COUNT_DELTA)) {
                promise.resolve(true);
                return;
              }
            }
            promise.resolve(false);
          }
        });
  }
}
