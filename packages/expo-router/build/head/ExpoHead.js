import React from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
export const Head = ({ children }) => {
    return <Helmet>{children}</Helmet>;
};
Head.Provider = HelmetProvider;
//# sourceMappingURL=ExpoHead.js.map