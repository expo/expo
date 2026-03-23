export function getLabel(
  options: { label?: string; title?: string },
  fallback: string
): string {
  return options.label !== undefined
    ? options.label
    : options.title !== undefined
      ? options.title
      : fallback;
}
