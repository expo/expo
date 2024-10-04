import { Button, ButtonProps } from '@expo/styleguide';

type Props = {
  onClick?: ButtonProps['onClick'];
};

export function SnippetExpandOverlay({ onClick }: Props) {
  return (
    <div className="flex absolute bottom-0 left-0 p-6 w-full bg-gradient-to-b from-transparent to-default">
      <Button theme="secondary" onClick={onClick} className="mx-auto">
        Show more
      </Button>
    </div>
  );
}
