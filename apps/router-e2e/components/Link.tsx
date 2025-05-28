'use client';

import { LinkProps, useRouter, Link as ExpoLink } from 'expo-router';
import { useEffect } from 'react';

import { Preview } from './Preview';

import PeekAndPopNativeComponent from '@/specs/PeekAndPopNativeComponent';
import PeekAndPopPreviewNativeComponent from '@/specs/PeekAndPopPreviewNativeComponent';
import PeekAndPopTriggerNativeComponent from '@/specs/PeekAndPopTriggerNativeComponent';

interface CustomLinkProps extends LinkProps {
  preview?: boolean;
}

export function Link(props: CustomLinkProps) {
  return props.preview ? <LinkWithPreview {...props} /> : <ExpoLink {...props} />;
}

function LinkWithPreview({ preview, ...rest }: CustomLinkProps) {
  const router = useRouter();
  useEffect(() => {
    setTimeout(() => {
      router.prefetch(rest.href);
    }, 100);
  }, []);
  return (
    <PeekAndPopNativeComponent
      onPreviewTapped={() => {
        setTimeout(() => {
          router.navigate(rest.href);
        }, 300);
      }}>
      <PeekAndPopTriggerNativeComponent>
        <ExpoLink {...rest} />
      </PeekAndPopTriggerNativeComponent>
      <PeekAndPopPreviewNativeComponent>
        <Preview href={rest.href} />
      </PeekAndPopPreviewNativeComponent>
    </PeekAndPopNativeComponent>
  );
}
