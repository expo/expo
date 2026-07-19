let hasWarned = false;

module.exports = (api) => {
  return {
    name: 'expo-router-babel-deprecated',
    visitor: {
      Program() {
        if (!hasWarned) {
          hasWarned = true;
          console.warn(
            'expo-router/babel is deprecated in favor of babel-preset-expo in SDK 50. To fix the issue, remove "expo-router/babel" from "plugins" in your babel.config.js file.'
          );
        }
      },
    },
  };
};
