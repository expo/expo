// The entry component (one that uses context modules) cannot be in the same file as the
// entry side-effects, otherwise they'll be updated when files are added/removed from the
// app directory. This will cause a lot of unfortunate errors regarding HMR and Fast Refresh.
// This is because Fast Refresh is sending the entire file containing an updated component.
import React from 'react';
import { ExpoRoot } from './ExpoRoot';
import { Head } from './head';
import { ctx } from '../_ctx';
// Must be exported or Fast Refresh won't update the context
export function App() {
    return (React.createElement(Head.Provider, null,
        React.createElement(ExpoRoot, { context: ctx })));
}
//# sourceMappingURL=qualified-entry.js.map