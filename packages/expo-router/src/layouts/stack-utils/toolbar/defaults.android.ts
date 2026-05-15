import { Color } from '../../../color';

export const DEFAULT_TOOLBAR_TINT_COLOR = () => Color.android.dynamic.onSurface as string;
export const DEFAULT_TOOLBAR_BACKGROUND_COLOR = () =>
  Color.android.dynamic.surfaceContainer as string;
export const DEFAULT_DESTRUCTIVE_COLOR = () => Color.android.material.error as string;
