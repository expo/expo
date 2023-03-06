import { Button } from '@expo/styleguide';
import { ArrowUpRightIcon } from '@expo/styleguide-icons';

type CreateAppButtonProps = { href: string; name: string };

export const CreateAppButton = ({ href, name }: CreateAppButtonProps) => (
  <Button
    className="flex fit-content medium:min-w-full"
    href={href}
    openInNewTab
    rightSlot={<ArrowUpRightIcon />}>
    Create {name} App
  </Button>
);
