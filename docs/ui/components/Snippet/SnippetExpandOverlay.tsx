import { Button, ButtonProps } from '@expo/styleguide';

export const EXPAND_SNIPPET_BOUND = 408;
export const EXPAND_SNIPPET_BOUND_CLASSNAME = 'max-h-[408px]';

type Props = {
  onClick?: ButtonProps['onClick'];
};

export function SnippetExpandOverlay({ onClick }: Props) {
  return (
    <div className="flex absolute bottom-0 left-0 p-6 w-full bg-default-fade-down">
      <Button theme="secondary" onClick={onClick} className="mx-auto">
        Show more
      </Button>
    </div>
  );
}
