import * as React from 'react';

export default function usePermissions(
  permissionRequester: () => Promise<{ granted: boolean }>
): [boolean] {
  const [granted, setGranted] = React.useState(false);

  React.useEffect(() => {
    async function askAsync() {
      const response = await permissionRequester();
      setGranted(response.granted);
    }

    askAsync();
  }, []);

  return [granted];
}
