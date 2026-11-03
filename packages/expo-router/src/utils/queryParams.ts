export function stringifySearchParams(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();

  for (const [name, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined) {
          searchParams.append(name, item === null ? '' : String(item));
        }
      }
    } else if (value !== undefined) {
      searchParams.append(name, value === null ? '' : String(value));
    }
  }

  return searchParams.toString();
}
