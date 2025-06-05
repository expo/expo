'use client';

import { useState } from 'react';

import { useLinkPreviewContext } from './LinkPreviewContext';
import { Preview } from './Preview';
import { useScreenPreload } from './hooks';
import { PeekAndPopPreviewView, PeekAndPopTriggerView, PeekAndPopView } from './native';
import { useRouter } from '../../hooks';
import { Link as ExpoLink, LinkProps } from '../Link';

interface CustomLinkProps extends LinkProps {
  preview?: boolean;
}

const externalPageRegex = /^(\w+\:)?\/\/.*$/;
const isExternal = (href: string) => externalPageRegex.test(href);

export function CustomLink(props: CustomLinkProps) {
  if (props.preview) {
    if (isExternal(String(props.href))) {
      console.warn('External links previews are not supported');
    } else if (props.replace) {
      console.warn('Using replace links with preview is not supported');
    } else {
      return <LinkWithPreview {...props} />;
    }
  }
  return <ExpoLink {...props} />;
}

function LinkWithPreview({ preview, ...rest }: CustomLinkProps) {
  const router = useRouter();
  const { setIsPreviewOpen } = useLinkPreviewContext();
  const [isCurrentPreviewOpen, setIsCurrenPreviewOpen] = useState(false);
  const [nativeTag, setNativeTag] = useState<number | undefined>();

  const { preload, getNativeTag, isValid } = useScreenPreload(rest.href);

  if (!isValid) {
    console.warn(
      `Preview link is not within react-native-screens stack. The preview will not work [${rest.href}]`
    );
    return <ExpoLink {...rest} />;
  }

  // TODO: add a way to add and customize preview actions
  return (
    <PeekAndPopView
      nextScreenKey={nativeTag ?? 0}
      onWillPreviewOpen={() => {
        preload();
        setIsPreviewOpen(true);
        setIsCurrenPreviewOpen(true);
        // We need to wait here for the screen to preload. This will happen in the next tick
        setTimeout(() => setNativeTag(getNativeTag()));
      }}
      onPreviewWillClose={() => {}}
      onPreviewDidClose={() => {
        setIsPreviewOpen(false);
        setIsCurrenPreviewOpen(false);
      }}
      onPreviewTapped={() => {
        router.navigate(rest.href);
      }}>
      <PeekAndPopTriggerView>
        <ExpoLink {...rest} />
      </PeekAndPopTriggerView>
      <PeekAndPopPreviewView style={{ position: 'absolute' }}>
        {/* TODO: Add a way to make preview smaller then full size */}
        {isCurrentPreviewOpen && <Preview href={rest.href} />}
      </PeekAndPopPreviewView>
    </PeekAndPopView>
  );
}
