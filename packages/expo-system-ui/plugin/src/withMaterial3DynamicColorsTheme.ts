import { withAndroidAttrs } from '@expo/config-plugins/build/plugins/android-plugins.js';
import Debug from 'debug';
import { AndroidConfig, ConfigPlugin, withAndroidStyles } from 'expo/config-plugins';

const debug = Debug('expo-system-ui:withMaterial3DynamicColorsTheme');

export const withMaterial3DynamicColorsTheme: ConfigPlugin = (config) => {
  if (config.experiments?.material3DynamicColorsTheme === true) {
    debug('✅ Enabling Material3 Dynamic Colors theme for Android');
    config = withAndroidStyles(config, (config) => {
      config.modResults = replaceAppThemeParent(
        config.modResults,
        'Theme.Material3.DynamicColors.DayNight.NoActionBar'
      );
      config.modResults = addExpoDynamicColorsToAppTheme(config.modResults);
      return config;
    });
    config = withAndroidAttrs(config, (config) => {
      config.modResults = addExpoDynamicColorsAttrs(config.modResults);
      return config;
    });
  }
  return config;
};

function replaceAppThemeParent(styles: AndroidConfig.Resources.ResourceXML, newParent: string) {
  const group = {
    name: 'AppTheme',
    parent: newParent,
  };

  styles.resources.style = styles.resources.style?.map?.((style) => {
    const head = style.$;
    if (head.name === group.name) {
      return {
        ...style,
        $: {
          ...head,
          parent: group.parent,
        },
      };
    }
    return style;
  });

  return styles;
}

function addExpoDynamicColorsToAppTheme(styles: AndroidConfig.Resources.ResourceXML) {
  const name = 'AppTheme';

  styles.resources.style = styles.resources.style?.map?.((style) => {
    const head = style.$;
    if (head.name === name) {
      return {
        ...style,
        // e.g. <item name="expoMaterialPrimary">?attr/colorPrimary</item>
        item: [
          ...(style.item ?? []),
          ...customItems.map((item) => ({
            $: {
              name: item,
            },
            _: `?attr/${item.replace('expoMaterial', 'color')}`,
          })),
        ],
      };
    }
    return style;
  });

  return styles;
}

function addExpoDynamicColorsAttrs(attrs: AndroidConfig.Resources.ResourceXML) {
  const existingAttrs = attrs.resources.attr ?? [];
  attrs.resources.attr = [
    ...existingAttrs,
    ...customItems.map((item) => ({
      $: {
        name: item,
        format: 'reference',
      },
    })),
  ];
  return attrs;
}

const customItems = [
  'expoMaterialPrimary',
  'expoMaterialOnPrimary',
  'expoMaterialPrimaryContainer',
  'expoMaterialOnPrimaryContainer',
  'expoMaterialPrimaryInverse',
  'expoMaterialPrimaryFixed',
  'expoMaterialPrimaryFixedDim',
  'expoMaterialOnPrimaryFixed',
  'expoMaterialOnPrimaryFixedVariant',
  'expoMaterialSecondary',
  'expoMaterialOnSecondary',
  'expoMaterialSecondaryContainer',
  'expoMaterialOnSecondaryContainer',
  'expoMaterialSecondaryFixed',
  'expoMaterialSecondaryFixedDim',
  'expoMaterialOnSecondaryFixed',
  'expoMaterialOnSecondaryFixedVariant',
  'expoMaterialTertiary',
  'expoMaterialOnTertiary',
  'expoMaterialTertiaryContainer',
  'expoMaterialOnTertiaryContainer',
  'expoMaterialTertiaryFixed',
  'expoMaterialTertiaryFixedDim',
  'expoMaterialOnTertiaryFixed',
  'expoMaterialOnTertiaryFixedVariant',
  'expoMaterialError',
  'expoMaterialOnError',
  'expoMaterialErrorContainer',
  'expoMaterialOnErrorContainer',
  'expoMaterialOutline',
  'expoMaterialOutlineVariant',
  'expoMaterialOnBackground',
  'expoMaterialSurface',
  'expoMaterialOnSurface',
  'expoMaterialSurfaceVariant',
  'expoMaterialOnSurfaceVariant',
  'expoMaterialSurfaceInverse',
  'expoMaterialOnSurfaceInverse',
  'expoMaterialSurfaceBright',
  'expoMaterialSurfaceDim',
  'expoMaterialSurfaceContainer',
  'expoMaterialSurfaceContainerLow',
  'expoMaterialSurfaceContainerLowest',
  'expoMaterialSurfaceContainerHigh',
  'expoMaterialSurfaceContainerHighest',
];
