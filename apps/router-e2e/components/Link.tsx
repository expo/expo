'use client';

import { LinkProps, useRouter, Link as ExpoLink, useNavigation } from 'expo-router';
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
  const navigation = useNavigation();
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
    setTimeout(() => {
      router.prefetch(rest.href);
    }, 100);
    });
    return unsubscribe;
  }, []);
  return (
    <PeekAndPopNativeComponent
      onPreviewTapped={() => {
        navigation.setOptions({
          animation: 'none',
        });
          router.navigate(rest.href);
      }}>
      <PeekAndPopTriggerNativeComponent>
        <ExpoLink {...rest} />
      </PeekAndPopTriggerNativeComponent>
      <PeekAndPopPreviewNativeComponent style={{ position: 'absolute' }}>
        <Preview href={rest.href} />
      </PeekAndPopPreviewNativeComponent>
    </PeekAndPopNativeComponent>
  );
}
