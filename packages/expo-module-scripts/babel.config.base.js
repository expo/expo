export default function (api) {
  api.cache(true);
  return {
    plugins: [
      [
        'babel-plugin-react-compiler', {
          compilationMode: 'annotation'
        }
      ]
    ],
    presets: ['babel-preset-expo'],
  };
};
