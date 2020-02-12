import React, { forwardRef } from 'react';
import View from '../primitives/View';
export const Section = forwardRef((props, ref) => {
    return <View accessibilityRole="summary" {...props} ref={ref}/>;
});
//# sourceMappingURL=Section.js.map