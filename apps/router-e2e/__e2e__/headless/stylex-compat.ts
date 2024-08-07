import * as stylex from '@stylexjs/stylex';

export function stylexProps(...styles: any[]) {
  let { className, style = [], ...props } = stylex.props(...styles);

  if (!Array.isArray(style)) style = [style];
  style.push({ $$css: true, [className]: className });

  return { style, ...props };
}
