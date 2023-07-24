import React from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
export const Head = ({ children }) => {
    return React.createElement(Helmet, null, children);
};
Head.Provider = HelmetProvider;
//# sourceMappingURL=ExpoHead.js.map