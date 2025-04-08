import React from 'react';
import { Helmet, HelmetProvider } from '../../vendor/react-helmet-async/lib';
export const Head = ({ children }) => {
    return <Helmet>{children}</Helmet>;
};
Head.Provider = HelmetProvider;
//# sourceMappingURL=ExpoHead.js.map