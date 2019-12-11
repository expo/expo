import * as React from 'react';

export default function useLinking() {
  const [link, setLink] = React.useState(window.location.href);

  React.useEffect(() => {
    function onChange() {
      setLink(window.location.href);
    }

    window.addEventListener('hashchange', onChange, false);

    return () => window.removeEventListener('hashchange', onChange, false);
  }, []);

  return link;
}
