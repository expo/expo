'use client';

import { createContext } from 'react';

/**
 * Whether the views below are laid out by a native layout system, such as SwiftUI and Compose inside an
 * `@expo/ui` `Host`, and not by Yoga. A native view rendered where this is `true` gets no Yoga box
 * (`display: contents`), because its Yoga position would not be where it is drawn.
 * @hidden
 */
export const NativeLayoutContext = createContext(false);
