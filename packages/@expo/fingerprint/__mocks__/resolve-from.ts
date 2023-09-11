const resolveFrom = jest.requireActual('resolve-from');

function mockedResolveFrom(fromDirectory: string, moduleId: string, silent: boolean) {
  if (fromDirectory === '/app' && moduleId === './package.json') {
    // Mock call for resolveFrom('/app', './package.json')
    return '/app/package.json';
  } else {
    // We should use the resolve from current projectRoot rather than mocked /app.
    // E.g. resolveFrom('/app', 'expo/config') -> resolveFrom(__dirname, 'expo/config')
    return silent ? resolveFrom.silent(__dirname, moduleId) : resolveFrom(__dirname, moduleId);
  }
}

module.exports = jest
  .fn()
  .mockImplementation((fromDirectory: string, moduleId: string) =>
    mockedResolveFrom(fromDirectory, moduleId, false)
  );

module.exports.silent = jest
  .fn()
  .mockImplementation((fromDirectory: string, moduleId: string) =>
    mockedResolveFrom(fromDirectory, moduleId, true)
  );
