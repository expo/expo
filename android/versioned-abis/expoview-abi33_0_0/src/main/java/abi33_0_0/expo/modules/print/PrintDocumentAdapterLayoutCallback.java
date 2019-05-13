  /* @tsapeta:
  `PrintDocumentAdapter.LayoutResultCallback` cannot be accessed outside `android.print` package,
  so this file must be packaged as `android.print` to make the callback class accessible.

  See an issue on StackOverflow for more details:
  https://stackoverflow.com/questions/44553592/layoutresultcallback-is-not-public-in-layoutresultcallback-cannot-be-accessed
 */

package android.print;

public abstract class PrintDocumentAdapterLayoutCallback extends PrintDocumentAdapter.LayoutResultCallback {

}
