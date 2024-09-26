import { Button } from '@expo/styleguide';
import { ArrowUpRightIcon } from '@expo/styleguide-icons/outline/ArrowUpRightIcon';

type CreateAppButtonProps = { href: string; name: string };

export const CreateAppButton = ({ href, name }: CreateAppButtonProps) => (
  <Button
    className="flex w-fit justify-center max-medium:min-w-full"
    href={href}
    openInNewTab
    rightSlot={<ArrowUpRightIcon />}>
    Create {name} App
  </Button>
);
