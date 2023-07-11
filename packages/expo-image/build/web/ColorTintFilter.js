import React from 'react';
export function getColorTintStyle(tintColor) {
    if (!tintColor)
        return {};
    return {
        filter: `url(#tint-${tintColor})`,
    };
}
export default function ColorTintFilter({ tintColor }) {
    if (!tintColor)
        return null;
    return (React.createElement("svg", null,
        React.createElement("defs", null,
            React.createElement("filter", { id: `tint-${tintColor}`, x: "0", y: "0", width: "0", height: "0" },
                React.createElement("feFlood", { floodColor: tintColor, floodOpacity: "1", result: "flood" }),
                React.createElement("feComposite", { in: "flood", in2: "SourceAlpha", operator: "in" })))));
}
//# sourceMappingURL=ColorTintFilter.js.map