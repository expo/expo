export function withClassName(styles: any[] | any, className?: string) {
  if (className) {
    if (!Array.isArray(styles)) {
      styles = [styles];
    }
    return [...styles, { $$css: true, _: className }];
  }
  return styles;
}
