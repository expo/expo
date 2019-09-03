import React from 'react';
import { Link } from './router';

export const routes = {
  home: () => '/',
  settings: () => '/settings'
};

export const HomeLink = ({ children }) => <Link to={routes.home()}>{children}</Link>

export const SettingsLink = ({ children }) => <Link to={routes.settings()}>{children}</Link>
