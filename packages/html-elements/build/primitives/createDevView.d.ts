import React from 'react';
/** Extend a view with a `children` filter that asserts more helpful warnings/errors. */
export declare function createDevView<TView extends React.ComponentType<any>>(View: TView): React.ForwardRefExoticComponent<Omit<any, "ref"> & React.RefAttributes<TView>>;
//# sourceMappingURL=createDevView.d.ts.map