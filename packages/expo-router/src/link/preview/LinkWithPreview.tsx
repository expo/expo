'use client';

import { useState } from 'react';

import { usePeekAndPopContext } from './PeekAndPopContext';
import { Preview } from './Preview';
import { useScreenPreload } from './hooks';
import { useRouter } from '../../hooks';
import PeekAndPopNativeComponent from '../../specs/PeekAndPopNativeComponent';
import PeekAndPopPreviewNativeComponent from '../../specs/PeekAndPopPreviewNativeComponent';
import PeekAndPopTriggerNativeComponent from '../../specs/PeekAndPopTriggerNativeComponent';
import { Link as ExpoLink, LinkProps } from '../Link';

interface CustomLinkProps extends LinkProps {
  preview?: boolean;
}

const externalPageRegex = /^(\w+\:)?\/\/.*$/;
const isExternal = (href: string) => externalPageRegex.test(href);

export function Link(props: CustomLinkProps) {
  if (props.preview) {
    if (isExternal(String(props.href))) {
      console.warn('External links previews are not supported');
    }
    if (props.replace) {
      console.warn('Using replace links with preview is not supported');
    } else {
      return <LinkWithPreview {...props} />;
    }
  }
  return <ExpoLink {...props} />;
}

function LinkWithPreview({ preview, ...rest }: CustomLinkProps) {
  const router = useRouter();
  const { setIsGlobalTapped, isGlobalTapped } = usePeekAndPopContext();
  const [numberOfTaps, setNumberOfTaps] = useState(0);
  const [nativeTag, setNativeTag] = useState<number | undefined>();

  const { preload, getNativeTag } = useScreenPreload(rest.href);

  // TODO: add a way to add and customize preview actions
  return (
    <PeekAndPopNativeComponent
      nextScreenKey={nativeTag}
      onWillPreviewOpen={() => {
        preload();
        setIsGlobalTapped(true);
        setNumberOfTaps((prev) => prev + 1);
        // We need to wait here for the screen to preload. This will happen in the next tick
        setTimeout(() => setNativeTag(getNativeTag()));
      }}
      onPreviewClose={() => {
        setIsGlobalTapped(false);
      }}
      onPreviewTapped={() => {
        router.navigate(rest.href);
      }}>
      <PeekAndPopTriggerNativeComponent>
        <ExpoLink {...rest} />
      </PeekAndPopTriggerNativeComponent>
      <PeekAndPopPreviewNativeComponent style={{ position: 'absolute' }}>
        {/* TODO: Add a way to make preview smaller then full size */}
        {isGlobalTapped && <Preview key={numberOfTaps} href={rest.href} />}
      </PeekAndPopPreviewNativeComponent>
    </PeekAndPopNativeComponent>
  );
}
