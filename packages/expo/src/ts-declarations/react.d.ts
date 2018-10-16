import * as React from 'react';

declare module 'react' {
  export type ElementProps<C> = C extends React.Component<infer P, any> ? P : never;
}
