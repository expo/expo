import React from 'react';

export function createClassNameView<TView extends React.ComponentType<any>>(View: TView) {
  return View;
}
