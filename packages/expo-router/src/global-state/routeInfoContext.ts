'use client';

import { createContext } from 'react';

import { defaultRouteInfo } from './getRouteInfoFromState';

export const RouteInfoContext = createContext(defaultRouteInfo);
