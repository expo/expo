const { withAndroidStyles, withAppBuildGradle } = require('@expo/config-plugins');

// This is only needed if you want to style the native components with Material You styles.
// The DynamicColor API is available out of the box, without this plugin.
const withPlugin = (config) => {
  // Apply Android modifications
  config = withAppBuildGradle(config, (config) => {
    const materialDependency = `implementation 'com.google.android.material:material:1.12.0'`;
    if (!config.modResults.contents.includes(materialDependency)) {
      if (
        config.modResults.contents.includes('implementation("com.facebook.react:react-android")')
      ) {
        config.modResults.contents.replace(
          'implementation("com.facebook.react:react-android")',
          `implementation("com.facebook.react:react-android")\n  ${materialDependency}`
        );
      } else {
        throw new Error('Cannot find the react-android dependency in the build.gradle file');
      }
    }
    return config;
  });
  return withAndroidStyles(config, (config) => {
    const { style = [] } = config.modResults.resources;
    if (!style.length) {
      return config;
    }

    // Replace `AppTheme` and remove `ResetEditText`
    const excludedStyles = ['AppTheme', 'ResetEditText'];
    // Remove the hardcoded colors.
    const excludedAttributes = ['android:textColor', 'android:editTextStyle'];

    config.modResults.resources.style = [
      {
        $: {
          name: 'AppTheme',
          parent: 'Theme.Material3.DynamicColors.DayNight.NoActionBar',
        },
        item: [...style[0].item.filter(({ $ }) => !excludedAttributes.includes($.name))],
      },
      ...style.filter(({ $ }) => !excludedStyles.includes($.name)),
    ];

    return config;
  });
};

module.exports = withPlugin;
