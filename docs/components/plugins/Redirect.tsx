import React from 'react';

const Redirect = ({ path }: React.PropsWithChildren<{ path: string }>) => {
  React.useEffect(() => {
    setTimeout(() => {
      window.location.href = path;
    }, 0);
  });

  return null;
};

export default Redirect;
