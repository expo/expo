class LogReporter {
  update(event) {
    if (event.type === 'bundle_built') {
      event.type = 'bundle_build_done';
    }

    console.log(JSON.stringify(event));
  }
}

module.exports = LogReporter;
