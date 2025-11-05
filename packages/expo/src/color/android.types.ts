// #region Android Base Color Types
/**
 * Colors available in Android system resources from SDK 1
 */
export type AndroidBaseColorSDK1 =
  | 'background_dark'
  | 'background_dark'
  | 'background_light'
  | 'black'
  | 'darker_gray'
  | 'primary_text_dark'
  | 'primary_text_dark_nodisable'
  | 'primary_text_light'
  | 'primary_text_light_nodisable'
  | 'secondary_text_dark'
  | 'secondary_text_dark_nodisable'
  | 'secondary_text_light'
  | 'secondary_text_light_nodisable'
  | 'tab_indicator_text'
  | 'tertiary_text_dark'
  | 'tertiary_text_light'
  | 'transparent'
  | 'white'
  | 'widget_edittext_dark';

/**
 * Colors available in Android system resources from SDK 14
 */
export type AndroidBaseColorSDK14 =
  | 'holo_blue_bright'
  | 'holo_blue_dark'
  | 'holo_blue_light'
  | 'holo_green_dark'
  | 'holo_green_light'
  | 'holo_orange_dark'
  | 'holo_orange_light'
  | 'holo_purple'
  | 'holo_red_dark'
  | 'holo_red_light';

/**
 * Colors available in Android system resources from SDK 31
 */
export type AndroidBaseColorSDK31 =
  | 'system_accent1_0'
  | 'system_accent1_10'
  | 'system_accent1_100'
  | 'system_accent1_1000'
  | 'system_accent1_200'
  | 'system_accent1_300'
  | 'system_accent1_400'
  | 'system_accent1_50'
  | 'system_accent1_500'
  | 'system_accent1_600'
  | 'system_accent1_700'
  | 'system_accent1_800'
  | 'system_accent1_900'
  | 'system_accent2_0'
  | 'system_accent2_10'
  | 'system_accent2_100'
  | 'system_accent2_1000'
  | 'system_accent2_200'
  | 'system_accent2_300'
  | 'system_accent2_400'
  | 'system_accent2_50'
  | 'system_accent2_500'
  | 'system_accent2_600'
  | 'system_accent2_700'
  | 'system_accent2_800'
  | 'system_accent2_900'
  | 'system_accent3_0'
  | 'system_accent3_10'
  | 'system_accent3_100'
  | 'system_accent3_1000'
  | 'system_accent3_200'
  | 'system_accent3_300'
  | 'system_accent3_400'
  | 'system_accent3_50'
  | 'system_accent3_500'
  | 'system_accent3_600'
  | 'system_accent3_700'
  | 'system_accent3_800'
  | 'system_accent3_900'
  | 'system_neutral1_0'
  | 'system_neutral1_10'
  | 'system_neutral1_100'
  | 'system_neutral1_1000'
  | 'system_neutral1_200'
  | 'system_neutral1_300'
  | 'system_neutral1_400'
  | 'system_neutral1_50'
  | 'system_neutral1_500'
  | 'system_neutral1_600'
  | 'system_neutral1_700'
  | 'system_neutral1_800'
  | 'system_neutral1_900'
  | 'system_neutral2_0'
  | 'system_neutral2_10'
  | 'system_neutral2_100'
  | 'system_neutral2_1000'
  | 'system_neutral2_200'
  | 'system_neutral2_300'
  | 'system_neutral2_400'
  | 'system_neutral2_50'
  | 'system_neutral2_500'
  | 'system_neutral2_600'
  | 'system_neutral2_700'
  | 'system_neutral2_800'
  | 'system_neutral2_900';

/**
 * Colors available in Android system resources from SDK 34
 */
export type AndroidBaseColorSDK34 =
  | 'system_background_dark'
  | 'system_background_light'
  | 'system_control_activated_dark'
  | 'system_control_activated_light'
  | 'system_control_highlight_dark'
  | 'system_control_highlight_light'
  | 'system_control_normal_dark'
  | 'system_control_normal_light'
  | 'system_error_container_dark'
  | 'system_error_container_light'
  | 'system_error_dark'
  | 'system_error_light'
  | 'system_on_background_dark'
  | 'system_on_background_light'
  | 'system_on_error_container_dark'
  | 'system_on_error_container_light'
  | 'system_on_error_dark'
  | 'system_on_error_light'
  | 'system_on_primary_container_dark'
  | 'system_on_primary_container_light'
  | 'system_on_primary_dark'
  | 'system_on_primary_fixed'
  | 'system_on_primary_fixed_variant'
  | 'system_on_primary_light'
  | 'system_on_secondary_container_dark'
  | 'system_on_secondary_container_light'
  | 'system_on_secondary_dark'
  | 'system_on_secondary_fixed'
  | 'system_on_secondary_fixed_variant'
  | 'system_on_secondary_light'
  | 'system_on_surface_dark'
  | 'system_on_surface_light'
  | 'system_on_surface_variant_dark'
  | 'system_on_surface_variant_light'
  | 'system_on_tertiary_container_dark'
  | 'system_on_tertiary_container_light'
  | 'system_on_tertiary_dark'
  | 'system_on_tertiary_fixed'
  | 'system_on_tertiary_fixed_variant'
  | 'system_on_tertiary_light'
  | 'system_outline_dark'
  | 'system_outline_light'
  | 'system_outline_variant_dark'
  | 'system_outline_variant_light'
  | 'system_palette_key_color_neutral_dark'
  | 'system_palette_key_color_neutral_light'
  | 'system_palette_key_color_neutral_variant_dark'
  | 'system_palette_key_color_neutral_variant_light'
  | 'system_palette_key_color_primary_dark'
  | 'system_palette_key_color_primary_light'
  | 'system_palette_key_color_secondary_dark'
  | 'system_palette_key_color_secondary_light'
  | 'system_palette_key_color_tertiary_dark'
  | 'system_palette_key_color_tertiary_light'
  | 'system_primary_container_dark'
  | 'system_primary_container_light'
  | 'system_primary_dark'
  | 'system_primary_fixed'
  | 'system_primary_fixed_dim'
  | 'system_primary_light'
  | 'system_secondary_container_dark'
  | 'system_secondary_container_light'
  | 'system_secondary_dark'
  | 'system_secondary_fixed'
  | 'system_secondary_fixed_dim'
  | 'system_secondary_light'
  | 'system_surface_bright_dark'
  | 'system_surface_bright_light'
  | 'system_surface_container_dark'
  | 'system_surface_container_high_dark'
  | 'system_surface_container_high_light'
  | 'system_surface_container_highest_dark'
  | 'system_surface_container_highest_light'
  | 'system_surface_container_light'
  | 'system_surface_container_low_dark'
  | 'system_surface_container_low_light'
  | 'system_surface_container_lowest_dark'
  | 'system_surface_container_lowest_light'
  | 'system_surface_dark'
  | 'system_surface_dim_dark'
  | 'system_surface_dim_light'
  | 'system_surface_light'
  | 'system_surface_variant_dark'
  | 'system_surface_variant_light'
  | 'system_tertiary_container_dark'
  | 'system_tertiary_container_light'
  | 'system_tertiary_dark'
  | 'system_tertiary_fixed'
  | 'system_tertiary_fixed_dim'
  | 'system_tertiary_light'
  | 'system_text_hint_inverse_dark'
  | 'system_text_hint_inverse_light'
  | 'system_text_primary_inverse_dark'
  | 'system_text_primary_inverse_disable_only_dark'
  | 'system_text_primary_inverse_disable_only_light'
  | 'system_text_primary_inverse_light'
  | 'system_text_secondary_and_tertiary_inverse_dark'
  | 'system_text_secondary_and_tertiary_inverse_disabled_dark'
  | 'system_text_secondary_and_tertiary_inverse_disabled_light'
  | 'system_text_secondary_and_tertiary_inverse_light';

/**
 * Colors available in Android system resources from SDK 35
 */
export type AndroidBaseColorSDK35 =
  | 'system_error_0'
  | 'system_error_10'
  | 'system_error_100'
  | 'system_error_1000'
  | 'system_error_200'
  | 'system_error_300'
  | 'system_error_400'
  | 'system_error_50'
  | 'system_error_500'
  | 'system_error_600'
  | 'system_error_700'
  | 'system_error_800'
  | 'system_error_900'
  | 'system_on_surface_disabled'
  | 'system_outline_disabled'
  | 'system_surface_disabled';

/**
 * Deprecated Android R.color resource names
 * @deprecated These colors were deprecated in API level 28
 */
export type DeprecatedColor =
  | 'primary_text_dark'
  | 'primary_text_dark_nodisable'
  | 'primary_text_light'
  | 'primary_text_light_nodisable'
  | 'secondary_text_dark'
  | 'secondary_text_dark_nodisable'
  | 'secondary_text_light'
  | 'secondary_text_light_nodisable'
  | 'tertiary_text_dark'
  | 'tertiary_text_light';

export type AndroidBaseColorName =
  | AndroidBaseColorSDK1
  | AndroidBaseColorSDK14
  | AndroidBaseColorSDK31
  | AndroidBaseColorSDK34
  | AndroidBaseColorSDK35
  | DeprecatedColor;

//#endregion

// #region Android Base Color Attr Types
export type AndroidBaseColorAttrSDK1 =
  | 'color'
  | 'colorBackground'
  | 'colorForeground'
  | 'colorForegroundInverse';

export type AndroidBaseColorAttrSDK5 = 'colorBackgroundCacheHint';

export type AndroidBaseColorAttrSDK14 =
  | 'colorActivatedHighlight'
  | 'colorFocusedHighlight'
  | 'colorLongPressedHighlight'
  | 'colorMultiSelectHighlight'
  | 'colorPressedHighlight';

export type AndroidBaseColorAttrSDK21 =
  | 'colorAccent'
  | 'colorButtonNormal'
  | 'colorControlActivated'
  | 'colorControlHighlight'
  | 'colorControlNormal'
  | 'colorEdgeEffect'
  | 'colorPrimary'
  | 'colorPrimaryDark';

export type AndroidBaseColorAttrSDK23 = 'colorBackgroundFloating';

export type AndroidBaseColorAttrSDK25 = 'colorSecondary';

export type AndroidBaseColorAttrSDK26 = 'colorError' | 'colorMode';

export type AndroidBaseColorAttr =
  | AndroidBaseColorAttrSDK1
  | AndroidBaseColorAttrSDK5
  | AndroidBaseColorAttrSDK14
  | AndroidBaseColorAttrSDK21
  | AndroidBaseColorAttrSDK23
  | AndroidBaseColorAttrSDK25
  | AndroidBaseColorAttrSDK26;
//#endregion
