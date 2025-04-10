import { Button } from '@expo/styleguide';
import { ArrowUpRightIcon } from '@expo/styleguide-icons/outline/ArrowUpRightIcon';

type CreateAppButtonProps = { href: string; name: string };

export const CreateAppButton = ({ href, name }: CreateAppButtonProps) => (
  <Button
    className="max-medium:min-w-full flex w-fit justify-center"
    href={href}
    openInNewTab
    rightSlot={<ArrowUpRightIcon />}>
    Create {name} App
  </Button>
);
