import { mergeClasses } from '@expo/styleguide';
import { GithubIcon } from '@expo/styleguide-icons/custom/GithubIcon';
import { MessageChatSquareDuotoneIcon } from '@expo/styleguide-icons/duotone/MessageChatSquareDuotoneIcon';
import { Rows03DuotoneIcon } from '@expo/styleguide-icons/duotone/Rows03DuotoneIcon';
import { StickerCircleDuotoneIcon } from '@expo/styleguide-icons/duotone/StickerCircleDuotoneIcon';

import { GridBox, Header } from '~/ui/components/Home/components';

export function ExploreExamples() {
  return (
    <>
      <Header
        title="Explore examples"
        description="Explore a variety of example projects showcasing how to use Expo and seamlessly integrate it
        with popular services."
      />
      <div
        className={mergeClasses(
          'my-4 inline-grid w-full grid-cols-4 gap-8',
          'max-xl-gutters:grid-cols-2',
          'max-lg-gutters:grid-cols-4',
          'max-md-gutters:grid-cols-2',
          'max-sm-gutters:grid-cols-1'
        )}>
        <GridBox
          title="StickerSmash"
          link="https://github.com/expo/examples/tree/master/stickersmash"
          icon={<StickerCircleDuotoneIcon className="size-16" />}
        />
        <GridBox
          title="Router + menus"
          link="https://github.com/expo/examples/tree/master/with-router-menus"
          icon={<Rows03DuotoneIcon className="size-16" />}
        />
        <GridBox
          title="API Routes + Open AI"
          link="https://github.com/expo/examples/tree/master/with-openai"
          icon={<MessageChatSquareDuotoneIcon className="size-16" />}
        />
        <GridBox
          title="View all examples"
          link="https://github.com/expo/examples"
          icon={<GithubIcon className="size-16" />}
        />
      </div>
    </>
  );
}
