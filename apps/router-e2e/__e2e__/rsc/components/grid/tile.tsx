'use dom';
import clsx from 'clsx';
import Label from '../label';
import { Div } from '@expo/html-elements';
import { Image } from '../../lib/react-native';

import '../../globals.css';

export default function GridTileImage({
  isInteractive = true,
  active,
  label,
  src,
  ...props
}: {
  isInteractive?: boolean;
  active?: boolean;
  src: string;
  label?: {
    title: string;
    amount: string;
    currencyCode: string;
    position?: 'bottom' | 'center';
  };
}) {
  if (process.env.EXPO_OS === 'web') {
    return (
      <div
        className={clsx(
          'group h-full w-full items-center justify-center overflow-hidden rounded-lg border bg-white hover:border-blue-600 dark:bg-black',
          {
            relative: label,
            'border-2 border-blue-600': active,
            'border-neutral-200 dark:border-neutral-800': !active,
          }
        )}>
        {src ? (
          <img
            className={clsx('relative h-full w-full object-contain', {
              'transition duration-300 ease-in-out group-hover:scale-105': isInteractive,
            })}
            src={src}
            {...props}
          />
        ) : null}
        {label ? (
          <Label
            title={label.title}
            amount={label.amount}
            currencyCode={label.currencyCode}
            position={label.position}
          />
        ) : null}
      </div>
    );
  }
  return (
    <Div
      className={clsx(
        'group flex flex-1 w-[100vw] h-[100vh] items-center justify-center overflow-hidden rounded-lg border bg-white hover:border-blue-600 dark:bg-black',
        {
          relative: label,
          'border-2 border-blue-600': active,
          'border-neutral-200 dark:border-neutral-800': !active,
        }
      )}>
      {src ? (
        <Image
          className={clsx('relative h-full w-full object-cover', {
            'transition duration-300 ease-in-out group-hover:scale-105': isInteractive,
          })}
          source={{ uri: src }}
          {...props}
        />
      ) : null}
      {label ? (
        <Label
          title={label.title}
          amount={label.amount}
          currencyCode={label.currencyCode}
          position={label.position}
        />
      ) : null}
    </Div>
  );
}
