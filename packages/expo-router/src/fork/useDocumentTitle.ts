/*
 * This file is unchanged, except for fixing imports and removing eslint comments
 */
import type {
  DocumentTitleOptions,
  NavigationContainerRef,
  ParamListBase,
} from '@react-navigation/native';
import * as React from 'react';

// import type { DocumentTitleOptions } from './types';

/**
 * Set the document title for the active screen
 */
export function useDocumentTitle(
  ref: React.RefObject<NavigationContainerRef<ParamListBase>>,
  {
    enabled = true,
    formatter = (options, route) => options?.title ?? route?.name,
  }: DocumentTitleOptions = {}
) {
  React.useEffect(() => {
    if (!enabled) {
      return;
    }

    const navigation = ref.current;

    if (navigation) {
      const title = formatter(navigation.getCurrentOptions(), navigation.getCurrentRoute());

      document.title = title;
    }

    return navigation?.addListener('options', (e) => {
      const title = formatter(e.data.options, navigation?.getCurrentRoute());

      document.title = title;
    });
  });
}
