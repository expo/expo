import { useRef, forwardRef, useEffect } from 'react';

/**
 * Copied from @react-navigation/core
 */
type Render = (children: React.ReactNode) => JSX.Element;

type Props = {
  render: Render;
  children: React.ReactNode;
};

const NavigationContent = ({ render, children }: Props) => {
  return render(children);
};

export function useComponent(render: Render) {
  const renderRef = useRef<Render | null>(render);

  // Normally refs shouldn't be mutated in render
  // But we return a component which will be rendered
  // So it's just for immediate consumption
  renderRef.current = render;

  useEffect(() => {
    renderRef.current = null;
  });

  return useRef(
    forwardRef(({ children }: { children: React.ReactNode }, _ref) => {
      const render = renderRef.current;

      if (render === null) {
        throw new Error(
          'The returned component must be rendered in the same render phase as the hook.'
        );
      }

      return <NavigationContent render={render}>{children}</NavigationContent>;
    })
  ).current;
}
