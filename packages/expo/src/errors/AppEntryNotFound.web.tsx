export function AppEntryNotFound() {
  return (
    <div
      style={{
        display: 'flex',
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#f2f2f2',
        minHeight: '100vh',
      }}>
      <p
        style={{
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: 24,
          fontWeight: 'bold',
          color: '#d32f2f',
          textAlign: 'center',
          marginBottom: 24,
        }}>
        App entry not found
      </p>
      <p
        style={{
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: 16,
          color: '#333',
          textAlign: 'center',
        }}>
        The app entry point named "main" was not registered. This may be due to an uncaught error
        thrown from a module's top-level code. Refer to the CLI logs and the native device logs for
        more detail.
      </p>
    </div>
  );
}
