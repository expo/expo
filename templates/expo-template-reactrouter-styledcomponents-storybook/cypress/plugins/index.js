const { addMatchImageSnapshotPlugin } = require('cypress-image-snapshot/plugin')

module.exports = (on) => {
  addMatchImageSnapshotPlugin(on)

  on('task', {
    log(message) {
      console.log(message)
      return null
    }
  })
}
