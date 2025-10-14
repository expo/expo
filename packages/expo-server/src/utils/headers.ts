export const appendHeadersRecord = (
  headers: Headers,
  updateHeaders: Record<string, string | string[]>
): void => {
  for (const headerName in updateHeaders) {
    if (Array.isArray(updateHeaders[headerName])) {
      for (const headerValue of updateHeaders[headerName]) {
        headers.append(headerName, headerValue);
      }
    } else if (updateHeaders[headerName] != null) {
      headers.set(headerName, updateHeaders[headerName]);
    }
  }
};
