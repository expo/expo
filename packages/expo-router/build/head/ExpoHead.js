import React from 'react';
import { Helmet, HelmetProvider } from '../../vendor/react-helmet-async/lib';
import { useIsFocused } from '../useIsFocused';
function FocusedHelmet({ children }) {
    return <Helmet>{children}</Helmet>;
}
export const Head = ({ children }) => {
    const isFocused = useIsFocused();
    if (!isFocused) {
        return null;
    }
    return <FocusedHelmet>{children}</FocusedHelmet>;
};
Head.Provider = HelmetProvider;
//# sourceMappingURL=ExpoHead.js.map