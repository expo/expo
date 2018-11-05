const process = require('process');

function main(args) {
  require('babel-register')({
    babelrc: false,
    plugins: [require('babel-plugin-transform-es2015-modules-commonjs')],
  });

  const Run = require('./Run');
  let Log = {
    collapsed: function(msg) {
      console.log('--- ' + msg);
    },
  };
  let options = require('minimist')(args);
  Run.ios(Log, options).catch(error => {
    console.error(error.toString());
    process.exit(1);
  });
}

if (require.main === module) {
  main(process.argv.slice(2));
}
