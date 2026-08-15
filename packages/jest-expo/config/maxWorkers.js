// Turbo runs package test tasks in parallel and each Jest spawns its own worker pool, which
// oversubscribes the CPU. `TURBO_HASH` marks a Turbo task; cap to one worker there and let Turbo
// parallelize across packages instead. Spread into a config's root, not its `projects`.
module.exports = process.env.TURBO_HASH ? { maxWorkers: 1 } : {};
