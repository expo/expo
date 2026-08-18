export const appendHeadersRecord = (
  headers: Headers,
  updateHeaders: Record<string, string | string[]>,
  shouldOverwrite: boolean
): void => {
  for (const headerName in updateHeaders) {
    if (Array.isArray(updateHeaders[headerName])) {
      for (const headerValue of updateHeaders[headerName]) {
        headers.append(headerName, headerValue);
      }
    } else if (!shouldOverwrite && headers.has(headerName)) {
      continue;
    } else if (updateHeaders[headerName] != null) {
      headers.set(headerName, updateHeaders[headerName]);
    }
  }
};

export const mergeHeaderInputs = (
  base: Record<string, string | string[]>,
  update: Record<string, string | string[]>
): Record<string, string | string[]> => {
  const merged: Record<string, string | string[]> = {};

  for (const [headerName, value] of Object.entries(base)) {
    merged[headerName.toLowerCase()] = Array.isArray(value) ? [...value] : value;
  }

  for (const headerName in update) {
    const value = update[headerName];
    if (value == null) {
      continue;
    }
    const key = headerName.toLowerCase();
    if (Array.isArray(value)) {
      const existing = merged[key];
      merged[key] =
        existing != null
          ? [...(Array.isArray(existing) ? existing : [existing]), ...value]
          : [...value];
    } else {
      merged[key] = value;
    }
  }

  return merged;
};
