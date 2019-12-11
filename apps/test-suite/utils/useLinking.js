import * as React from 'react';
import { Linking } from 'expo';

export default function useLinking() {
  const [link, setLink] = React.useState(null);

  React.useEffect(() => {
    function onChange({ url }) {
      setLink(url);
    }
    (async () => {
      try {
        setLink(await Linking.getInitialURL());
      } catch (error) {}
    })();

    Linking.addEventListener('url', onChange);

    return () => Linking.removeEventListener('url', onChange);
  }, []);

  return link;
}
