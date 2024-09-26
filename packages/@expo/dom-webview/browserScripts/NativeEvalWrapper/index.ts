(function () {
  const result = '%%SOURCE%%';
  // @ts-ignore
  if (result instanceof Promise) {
    result
      .then((resolved) => {
        const resolvedString = JSON.stringify(resolved);
        const script =
          'window.ExpoDomWebView.resolveDeferred("%%DEFERRED_ID%%", ' + resolvedString + ')';
        globalThis.expo.modules.ExpoDomWebViewModule.evalJsForWebViewAsync(
          '%%WEBVIEW_ID%%',
          script
        );
      })
      .catch((error) => {
        const errorString = JSON.stringify(error);
        const script =
          'window.ExpoDomWebView.rejectDeferred("%%DEFERRED_ID%%", ' + errorString + ')';
        globalThis.expo.modules.ExpoDomWebViewModule.evalJsForWebViewAsync(
          '%%WEBVIEW_ID%%',
          script
        );
      });
    return JSON.stringify({ isPromise: true, value: null });
  } else {
    return JSON.stringify({ isPromise: false, value: result });
  }
})();
