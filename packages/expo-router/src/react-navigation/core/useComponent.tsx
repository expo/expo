import * as React from 'react';

type Render = (children: React.ReactNode) => React.JSX.Element;

type Props = {
  render: Render;
  children: React.ReactNode;
};

const NavigationContent = ({ render, children }: Props) => {
  return render(children);
};

export function useComponent(render: Render) {
  const renderRef = React.useRef<Render | null>(render);

  // Normally refs shouldn't be mutated in render
  // But we return a component which will be rendered
  // So it's just for immediate consumption
  renderRef.current = render;

  React.useEffect(() => {
    renderRef.current = null;
  });

  return React.useRef(({ children }: { children: React.ReactNode }) => {
    const render = renderRef.current;

    if (render === null) {
      throw new Error(
        'The returned component must be rendered in the same render phase as the hook.'
      );
    }

    return <NavigationContent render={render}>{children}</NavigationContent>;
  }).current;
}
