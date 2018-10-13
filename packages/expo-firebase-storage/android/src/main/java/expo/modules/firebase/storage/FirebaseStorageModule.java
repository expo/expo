package expo.modules.firebase.storage;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.Context;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.util.Log;
import android.os.Environment;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Map;
import java.util.HashMap;

import android.net.Uri;
import android.support.annotation.NonNull;
import android.webkit.MimeTypeMap;

import com.google.android.gms.tasks.Task;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;

import com.google.firebase.FirebaseApp;
import com.google.firebase.storage.UploadTask;
import com.google.firebase.storage.StorageTask;
import com.google.firebase.storage.FirebaseStorage;
import com.google.firebase.storage.StorageMetadata;
import com.google.firebase.storage.StorageException;
import com.google.firebase.storage.StorageReference;
import com.google.firebase.storage.OnPausedListener;
import com.google.firebase.storage.StreamDownloadTask;
import com.google.firebase.storage.OnProgressListener;

import expo.core.ExportedModule;
import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.core.interfaces.ActivityProvider;
import expo.core.interfaces.ExpoMethod;
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.modules.firebase.app.Utils;


@SuppressWarnings("WeakerAccess")
public class FirebaseStorageModule extends ExportedModule implements ModuleRegistryConsumer {

  private static final String TAG = FirebaseStorageModule.class.getCanonicalName();

  private static final String DocumentDirectoryPath = "DOCUMENT_DIRECTORY_PATH";
  private static final String ExternalDirectoryPath = "EXTERNAL_DIRECTORY_PATH";
  private static final String ExternalStorageDirectoryPath = "EXTERNAL_STORAGE_DIRECTORY_PATH";
  private static final String PicturesDirectoryPath = "PICTURES_DIRECTORY_PATH";
  private static final String TemporaryDirectoryPath = "TEMP_DIRECTORY_PATH";
  private static final String CachesDirectoryPath = "CACHES_DIRECTORY_PATH";

  private static final String FileTypeRegular = "FILETYPE_REGULAR";
  private static final String FileTypeDirectory = "FILETYPE_DIRECTORY";

  private static final String STORAGE_EVENT = "Expo.Firebase.storage_event";
  private static final String STORAGE_STATE_CHANGED = "Expo.Firebase.state_changed";
  private static final String STORAGE_UPLOAD_SUCCESS = "Expo.Firebase.upload_success";
  private static final String STORAGE_UPLOAD_FAILURE = "Expo.Firebase.upload_failure";
  private static final String STORAGE_DOWNLOAD_SUCCESS = "Expo.Firebase.download_success";
  private static final String STORAGE_DOWNLOAD_FAILURE = "Expo.Firebase.download_failure";

  private ModuleRegistry mModuleRegistry;

  public FirebaseStorageModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return "ExpoFirebaseStorage";
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }

  protected final Context getApplicationContext() {
    return getCurrentActivity().getApplicationContext();
  }

  final Activity getCurrentActivity() {
    ActivityProvider activityProvider = mModuleRegistry.getModule(ActivityProvider.class);
    return activityProvider.getCurrentActivity();
  }

  /**
   * Check if we can write to storage, usually false if no permission set on manifest
   *
   * @return
   */
  public boolean isExternalStorageWritable() {
    boolean mExternalStorageAvailable;
    boolean mExternalStorageWritable;
    String state = Environment.getExternalStorageState();

    if (Environment.MEDIA_MOUNTED.equals(state)) {
      // we can read and write the media
      mExternalStorageAvailable = mExternalStorageWritable = true;
    } else if (Environment.MEDIA_MOUNTED_READ_ONLY.equals(state)) {
      // we can only read the media
      mExternalStorageAvailable = true;
      mExternalStorageWritable = false;
    } else {
      // something else is wrong. It may be one of many other states, but all we need
      // to know is we can neither read nor write
      mExternalStorageAvailable = mExternalStorageWritable = false;
    }

    return mExternalStorageAvailable && mExternalStorageWritable;
  }

  /**
   * delete
   *
   * @param path
   * @param promise
   * @url https://firebase.google.com/docs/reference/js/firebase.storage.Reference#delete
   */
  @ExpoMethod
  public void delete(String appName, final String path, final Promise promise) {
    StorageReference reference = this.getReference(path, appName);
    reference.delete().addOnSuccessListener(new OnSuccessListener<Void>() {
      @Override
      public void onSuccess(Void aVoid) {
        promise.resolve(null);
      }
    }).addOnFailureListener(new OnFailureListener() {
      @Override
      public void onFailure(@NonNull Exception exception) {
        promiseRejectStorageException(promise, exception);
      }
    });
  }

  /**
   * getDownloadURL
   *
   * @param path
   * @param promise
   * @url https://firebase.google.com/docs/reference/js/firebase.storage.Reference#getDownloadURL
   */
  @ExpoMethod
  public void getDownloadURL(String appName, final String path, final Promise promise) {
    Log.d(TAG, "getDownloadURL path " + path);
    final StorageReference reference = this.getReference(path, appName);

    Task<Uri> downloadTask = reference.getDownloadUrl();
    downloadTask
      .addOnSuccessListener(new OnSuccessListener<Uri>() {
        @Override
        public void onSuccess(Uri uri) {
          promise.resolve(uri.toString());
        }
      })
      .addOnFailureListener(new OnFailureListener() {
        @Override
        public void onFailure(@NonNull Exception exception) {
          promiseRejectStorageException(promise, exception);
        }
      });
  }

  /**
   * getMetadata
   *
   * @param path
   * @param promise
   * @url https://firebase.google.com/docs/reference/js/firebase.storage.Reference#getMetadata
   */
  @ExpoMethod
  public void getMetadata(String appName, final String path, final Promise promise) {
    StorageReference reference = this.getReference(path, appName);
    reference.getMetadata().addOnSuccessListener(new OnSuccessListener<StorageMetadata>() {
      @Override
      public void onSuccess(StorageMetadata storageMetadata) {
        promise.resolve(getMetadataAsMap(storageMetadata));
      }
    }).addOnFailureListener(new OnFailureListener() {
      @Override
      public void onFailure(@NonNull Exception exception) {
        promiseRejectStorageException(promise, exception);
      }
    });
  }

  /**
   * updateMetadata
   *
   * @param path
   * @param metadata
   * @param promise
   * @url https://firebase.google.com/docs/reference/js/firebase.storage.Reference#updateMetadata
   */
  @ExpoMethod
  public void updateMetadata(String appName, final String path, final Map<String, Object> metadata, final Promise promise) {
    StorageReference reference = this.getReference(path, appName);
    StorageMetadata md = buildMetadataFromMap(metadata, null);

    reference.updateMetadata(md).addOnSuccessListener(new OnSuccessListener<StorageMetadata>() {
      @Override
      public void onSuccess(StorageMetadata storageMetadata) {
        Bundle data = getMetadataAsMap(storageMetadata);
        promise.resolve(data);
      }
    }).addOnFailureListener(new OnFailureListener() {
      @Override
      public void onFailure(@NonNull Exception exception) {
        promiseRejectStorageException(promise, exception);
      }
    });
  }


  /**
   * downloadFile
   *
   * @param path
   * @param localPath
   * @param promise
   * @url https://firebase.google.com/docs/reference/js/firebase.storage.Reference#downloadFile
   */
  @ExpoMethod
  public void downloadFile(final String appName, final String path, final String localPath, final Promise promise) {
    if (!isExternalStorageWritable()) {
      promise.reject(
        "storage/invalid-device-file-path",
        "The specified device file path is invalid or is restricted."
      );

      return;
    }

    Log.d(TAG, "downloadFile path: " + path);
    StorageReference reference = this.getReference(path, appName);

    reference.getStream(new StreamDownloadTask.StreamProcessor() {
      @Override
      public void doInBackground(StreamDownloadTask.TaskSnapshot taskSnapshot, InputStream inputStream) throws IOException {
        int indexOfLastSlash = localPath.lastIndexOf("/");
        String pathMinusFileName = indexOfLastSlash > 0 ? localPath.substring(0, indexOfLastSlash) + "/" : "/";
        String filename = indexOfLastSlash > 0 ? localPath.substring(indexOfLastSlash + 1) : localPath;
        File fileWithJustPath = new File(pathMinusFileName);

        // directoriesCreated assignment for not consumed warning
        Boolean directoriesCreated = fileWithJustPath.mkdirs();
        File fileWithFullPath = new File(pathMinusFileName, filename);
        FileOutputStream output = new FileOutputStream(fileWithFullPath);
        int bufferSize = 1024;
        byte[] buffer = new byte[bufferSize];

        int len;
        while ((len = inputStream.read(buffer)) != -1) {
          output.write(buffer, 0, len);
        }

        output.close();
      }
    }).addOnProgressListener(new OnProgressListener<StreamDownloadTask.TaskSnapshot>() {
      @Override
      public void onProgress(StreamDownloadTask.TaskSnapshot taskSnapshot) {
        Log.d(TAG, "downloadFile progress " + taskSnapshot);
        Bundle event = getDownloadTaskAsMap(taskSnapshot);
        sendJSEvent(appName, STORAGE_STATE_CHANGED, path, event);
      }
    }).addOnPausedListener(new OnPausedListener<StreamDownloadTask.TaskSnapshot>() {
      @Override
      public void onPaused(StreamDownloadTask.TaskSnapshot taskSnapshot) {
        Log.d(TAG, "downloadFile paused " + taskSnapshot);
        Bundle event = getDownloadTaskAsMap(taskSnapshot);
        sendJSEvent(appName, STORAGE_STATE_CHANGED, path, event);
      }
    }).addOnSuccessListener(new OnSuccessListener<StreamDownloadTask.TaskSnapshot>() {
      @Override
      public void onSuccess(StreamDownloadTask.TaskSnapshot taskSnapshot) {
        Log.d(TAG, "downloadFile success" + taskSnapshot);
        Bundle resp = getDownloadTaskAsMap(taskSnapshot);
        sendJSEvent(appName, STORAGE_DOWNLOAD_SUCCESS, path, resp);
        resp = getDownloadTaskAsMap(taskSnapshot);
        promise.resolve(resp);
      }
    }).addOnFailureListener(new OnFailureListener() {
      @Override
      public void onFailure(@NonNull Exception exception) {
        Log.e(TAG, "downloadFile failure " + exception.getMessage());
        // TODO sendJS error event
        promiseRejectStorageException(promise, exception);
      }
    });
  }

  /**
   * setMaxDownloadRetryTime
   *
   * @param milliseconds
   * @url https://firebase.google.com/docs/reference/js/firebase.storage.Storage#setMaxDownloadRetryTime
   */
  @ExpoMethod
  public void setMaxDownloadRetryTime(String appName, final double milliseconds, Promise promise) {
    FirebaseApp firebaseApp = FirebaseApp.getInstance(appName);
    FirebaseStorage firebaseStorage = FirebaseStorage.getInstance(firebaseApp);

    firebaseStorage.setMaxDownloadRetryTimeMillis((long) milliseconds);
    promise.resolve(null);
  }

  /**
   * setMaxOperationRetryTime
   *
   * @param milliseconds
   * @url https://firebase.google.com/docs/reference/js/firebase.storage.Storage#setMaxOperationRetryTime
   */
  @ExpoMethod
  public void setMaxOperationRetryTime(String appName, final double milliseconds, Promise promise) {
    FirebaseApp firebaseApp = FirebaseApp.getInstance(appName);
    FirebaseStorage firebaseStorage = FirebaseStorage.getInstance(firebaseApp);

    firebaseStorage.setMaxOperationRetryTimeMillis((long) milliseconds);
    promise.resolve(null);
  }

  /**
   * setMaxUploadRetryTime
   *
   * @param milliseconds
   * @url https://firebase.google.com/docs/reference/js/firebase.storage.Storage#setMaxUploadRetryTime
   */
  @ExpoMethod
  public void setMaxUploadRetryTime(String appName, final double milliseconds, Promise promise) {
    FirebaseApp firebaseApp = FirebaseApp.getInstance(appName);
    FirebaseStorage firebaseStorage = FirebaseStorage.getInstance(firebaseApp);

    firebaseStorage.setMaxUploadRetryTimeMillis((long) milliseconds);
    promise.resolve(null);
  }

  /**
   * putFile
   *
   * @param path
   * @param localPath
   * @param metadata
   * @param promise
   * @url https://firebase.google.com/docs/reference/js/firebase.storage.Reference#putFile
   */
  @ExpoMethod
  public void putFile(final String appName, final String path, final String localPath, final Map<String, Object> metadata, final Promise promise) {
    StorageReference reference = this.getReference(path, appName);

    Log.i(TAG, "putFile: " + localPath + " to " + path);

    try {
      Uri file = getURI(localPath);
      StorageMetadata md = buildMetadataFromMap(metadata, file);
      UploadTask uploadTask = reference.putFile(file, md);

      // register observers to listen for when the download is done or if it fails
      uploadTask
        .addOnFailureListener(new OnFailureListener() {
          @Override
          public void onFailure(@NonNull Exception exception) {
            // handle unsuccessful uploads
            Log.e(TAG, "putFile failure " + exception.getMessage());
            // TODO sendJS error event
            promiseRejectStorageException(promise, exception);
          }
        })
        .addOnSuccessListener(new OnSuccessListener<UploadTask.TaskSnapshot>() {
          @Override
          public void onSuccess(UploadTask.TaskSnapshot taskSnapshot) {
            Log.d(TAG, "putFile success " + taskSnapshot);
            // to avoid readable map already consumed errors we run this three times
            getUploadTaskAsMap(taskSnapshot, new OnSuccessListener<Bundle>() {
              @Override
              public void onSuccess(Bundle event) {
                sendJSEvent(appName, STORAGE_STATE_CHANGED, path, event);
              }
            });

            getUploadTaskAsMap(taskSnapshot, new OnSuccessListener<Bundle>() {
              @Override
              public void onSuccess(Bundle event) {
                sendJSEvent(appName, STORAGE_UPLOAD_SUCCESS, path, event);
              }
            });

            getUploadTaskAsMap(taskSnapshot, new OnSuccessListener<Bundle>() {
              @Override
              public void onSuccess(Bundle event) {
                promise.resolve(event);
              }
            });
          }
        })
        .addOnProgressListener(new OnProgressListener<UploadTask.TaskSnapshot>() {
          @Override
          public void onProgress(UploadTask.TaskSnapshot taskSnapshot) {
            Log.d(TAG, "putFile progress " + taskSnapshot);
            getUploadTaskAsMap(taskSnapshot, new OnSuccessListener<Bundle>() {
              @Override
              public void onSuccess(Bundle event) {
                sendJSEvent(appName, STORAGE_STATE_CHANGED, path, event);
              }
            });
          }
        })
        .addOnPausedListener(new OnPausedListener<UploadTask.TaskSnapshot>() {
          @Override
          public void onPaused(UploadTask.TaskSnapshot taskSnapshot) {
            Log.d(TAG, "putFile paused " + taskSnapshot);
            getUploadTaskAsMap(taskSnapshot, new OnSuccessListener<Bundle>() {
              @Override
              public void onSuccess(Bundle event) {
                sendJSEvent(appName, STORAGE_STATE_CHANGED, path, event);
              }
            });
          }
        });
    } catch (Exception exception) {
      promiseRejectStorageException(promise, exception);
    }
  }

  /**
   * Internal helper to detect if ref is from url or a path.
   *
   * @param path
   * @return
   */
  private StorageReference getReference(String path, String appName) {
    FirebaseApp firebaseApp = FirebaseApp.getInstance(appName);
    FirebaseStorage firebaseStorage = FirebaseStorage.getInstance(firebaseApp);

    if (path.startsWith("url::")) {
      String url = path.substring(5);
      return firebaseStorage.getReferenceFromUrl(url);
    } else {
      return firebaseStorage.getReference(path);
    }
  }

  /**
   * Create a Uri from the path, defaulting to file when there is no supplied scheme
   *
   * @param uri
   * @return
   */
  private Uri getURI(final String uri) {
    Uri parsed = Uri.parse(uri);

    if (parsed.getScheme() == null || parsed.getScheme().isEmpty()) {
      return Uri.fromFile(new File(uri));
    }
    return parsed;
  }

  /**
   * Converts a Map<String, Object> into a StorageMetadata instance
   *
   * @param metadata
   * @return
   */
  private StorageMetadata buildMetadataFromMap(Map<String, Object> metadata, @Nullable Uri file) {
    StorageMetadata.Builder metadataBuilder = new StorageMetadata.Builder();

    try {
      Map<String, Object> m = metadata;
      Map<String, Object> customMetadata = (Map<String, Object>) m.get("customMetadata");
      if (customMetadata != null) {
        for (Map.Entry<String, Object> entry : customMetadata.entrySet()) {
          metadataBuilder.setCustomMetadata(entry.getKey(), String.valueOf(entry.getValue()));
        }
      }

      metadataBuilder.setCacheControl((String) m.get("cacheControl"));
      metadataBuilder.setContentDisposition((String) m.get("contentDisposition"));
      metadataBuilder.setContentEncoding((String) m.get("contentEncoding"));
      metadataBuilder.setContentLanguage((String) m.get("contentLanguage"));

      if (metadata.containsKey("contentType")) {
        metadataBuilder.setContentType((String) m.get("contentType"));
      } else if (file != null) {
        String mimeType = null;

        if (file.getScheme().equals(ContentResolver.SCHEME_CONTENT)) {
          ContentResolver cr = getApplicationContext().getContentResolver();
          mimeType = cr.getType(file);
        } else {
          String fileExtension = MimeTypeMap.getFileExtensionFromUrl(file
            .toString());
          mimeType = MimeTypeMap.getSingleton().getMimeTypeFromExtension(
            fileExtension.toLowerCase());
        }

        if (mimeType != null) metadataBuilder.setContentType(mimeType);
      }
    } catch (Exception e) {
      Log.e(TAG, "error while building meta data " + e.getMessage());
    }

    return metadataBuilder.build();
  }

  /**
   * Convert an download task snapshot to a Bundle
   *
   * @param taskSnapshot
   * @return
   */
  private Bundle getDownloadTaskAsMap(final StreamDownloadTask.TaskSnapshot taskSnapshot) {
    Bundle resp = new Bundle();
    resp.putDouble("bytesTransferred", taskSnapshot.getBytesTransferred());
    resp.putString("ref", taskSnapshot.getStorage().getPath());
    resp.putString("state", this.getTaskStatus(taskSnapshot.getTask()));
    resp.putDouble("totalBytes", taskSnapshot.getTotalByteCount());

    return resp;
  }


  /**
   * Convert an upload task snapshot to a Bundle
   *
   * @param taskSnapshot
   * @return
   */
  private void getUploadTaskAsMap(final UploadTask.TaskSnapshot taskSnapshot, final OnSuccessListener<Bundle> listener) {
    if (taskSnapshot != null) {
      taskSnapshot.getStorage().getDownloadUrl().addOnSuccessListener(new OnSuccessListener<Uri>() {
        @Override
        public void onSuccess(Uri downloadUrl) {
          Bundle resp = new Bundle();

          resp.putDouble("bytesTransferred", taskSnapshot.getBytesTransferred());
          resp.putString("downloadURL", downloadUrl.toString());

          StorageMetadata d = taskSnapshot.getMetadata();
          if (d != null) {
            Bundle metadata = getMetadataAsMap(d);
            resp.putBundle("metadata", metadata);
          }

          resp.putString("ref", taskSnapshot.getStorage().getPath());
          resp.putString("state", FirebaseStorageModule.this.getTaskStatus(taskSnapshot.getTask()));
          resp.putDouble("totalBytes", taskSnapshot.getTotalByteCount());

          listener.onSuccess(resp);
        }
      });
    } else {
      listener.onSuccess(new Bundle());
    }
  }

  /**
   * Converts storageMetadata into a map
   *
   * @param storageMetadata
   * @return
   */
  private Bundle getMetadataAsMap(StorageMetadata storageMetadata) {
    Bundle metadata = new Bundle();
    metadata.putString("bucket", storageMetadata.getBucket());
    metadata.putString("generation", storageMetadata.getGeneration());
    metadata.putString("metageneration", storageMetadata.getMetadataGeneration());
    metadata.putString("fullPath", storageMetadata.getPath());
    metadata.putString("name", storageMetadata.getName());
    metadata.putDouble("size", storageMetadata.getSizeBytes());
    metadata.putDouble("timeCreated", storageMetadata.getCreationTimeMillis());
    metadata.putDouble("updated", storageMetadata.getUpdatedTimeMillis());
    metadata.putString("md5hash", storageMetadata.getMd5Hash());
    metadata.putString("cacheControl", storageMetadata.getCacheControl());
    metadata.putString("contentDisposition", storageMetadata.getContentDisposition());
    metadata.putString("contentEncoding", storageMetadata.getContentEncoding());
    metadata.putString("contentLanguage", storageMetadata.getContentLanguage());
    metadata.putString("contentType", storageMetadata.getContentType());

    Bundle customMetadata = new Bundle();
    for (String key : storageMetadata.getCustomMetadataKeys()) {
      customMetadata.putString(key, storageMetadata.getCustomMetadata(key));
    }
    metadata.putBundle("customMetadata", customMetadata);

    return metadata;
  }

  /**
   * Returns the task status as string
   *
   * @param task
   * @return
   */
  private String getTaskStatus(StorageTask<?> task) {
    if (task.isInProgress()) {
      return "running";
    } else if (task.isPaused()) {
      return "paused";
    } else if (task.isSuccessful() || task.isComplete()) {
      return "success";
    } else if (task.isCanceled()) {
      return "cancelled";
    } else if (task.getException() != null) {
      return "error";
    } else {
      return "unknown";
    }
  }

  /**
   * @param name
   * @param path
   * @param body
   */
  private void sendJSEvent(String appName, final String name, final String path, Bundle body) {
    Bundle event = new Bundle();
    event.putBundle("body", body);
    event.putString("path", path);
    event.putString("eventName", name);
    event.putString("appName", appName);
    Utils.sendEvent(mModuleRegistry, STORAGE_EVENT, event);
  }

  /**
   * Reject a promise with a web sdk error code
   *
   * @param promise
   * @param exception
   */
  private void promiseRejectStorageException(Promise promise, Exception exception) {
    String code = "storage/unknown";
    String message = exception.getMessage();

    try {
      if (exception instanceof StorageException) {
        StorageException storageException = (StorageException) exception;

        switch (storageException.getErrorCode()) {
          case StorageException.ERROR_UNKNOWN:
            code = "storage/unknown";
            message = "An unknown error has occurred.";
            break;
          case StorageException.ERROR_OBJECT_NOT_FOUND:
            code = "storage/object-not-found";
            message = "No object exists at the desired reference.";
            break;
          case StorageException.ERROR_BUCKET_NOT_FOUND:
            code = "storage/bucket-not-found";
            message = "No bucket is configured for Firebase Storage.";
            break;
          case StorageException.ERROR_PROJECT_NOT_FOUND:
            code = "storage/project-not-found";
            message = "No project is configured for Firebase Storage.";
            break;
          case StorageException.ERROR_QUOTA_EXCEEDED:
            code = "storage/quota-exceeded";
            message = "Quota on your Firebase Storage bucket has been exceeded.";
            break;
          case StorageException.ERROR_NOT_AUTHENTICATED:
            code = "storage/unauthenticated";
            message = "User is unauthenticated. Authenticate and try again.";
            break;
          case StorageException.ERROR_NOT_AUTHORIZED:
            code = "storage/unauthorized";
            message = "User is not authorized to perform the desired action.";
            break;
          case StorageException.ERROR_RETRY_LIMIT_EXCEEDED:
            code = "storage/retry-limit-exceeded";
            message = "The maximum time limit on an operation (upload, download, delete, etc.) has been exceeded.";
            break;
          case StorageException.ERROR_INVALID_CHECKSUM:
            code = "storage/non-matching-checksum";
            message = "File on the client does not match the checksum of the file received by the server.";
            break;
          case StorageException.ERROR_CANCELED:
            code = "storage/cancelled";
            message = "User cancelled the operation.";
            break;
        }
      } else {
        code = "storage/unknown";
        message = "An unknown error has occurred.";
      }
    } finally {
      promise.reject(code, message, exception);
    }
  }

  /**
   * Constants bootstrapped on react native app boot
   * e.g. firebase.storage.Native.DOCUMENT_DIRECTORY_PATH
   *
   * @return
   */
  @Override
  public Map<String, Object> getConstants() {
    final Map<String, Object> constants = new HashMap<>();

    constants.put(DocumentDirectoryPath, this.getApplicationContext().getFilesDir().getAbsolutePath());
    constants.put(TemporaryDirectoryPath, this.getApplicationContext().getCacheDir().getAbsolutePath());
    constants.put(PicturesDirectoryPath, Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES).getAbsolutePath());
    constants.put(CachesDirectoryPath, this.getApplicationContext().getCacheDir().getAbsolutePath());
    constants.put(FileTypeRegular, 0);
    constants.put(FileTypeDirectory, 1);

    File externalStorageDirectory = Environment.getExternalStorageDirectory();
    if (externalStorageDirectory != null) {
      constants.put(ExternalStorageDirectoryPath, externalStorageDirectory.getAbsolutePath());
    } else {
      constants.put(ExternalStorageDirectoryPath, null);
    }

    File externalDirectory = this.getApplicationContext().getExternalFilesDir(null);
    if (externalDirectory != null) {
      constants.put(ExternalDirectoryPath, externalDirectory.getAbsolutePath());
    } else {
      constants.put(ExternalDirectoryPath, null);
    }

    return constants;
  }
}
