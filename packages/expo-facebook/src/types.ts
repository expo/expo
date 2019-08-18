export type FacebookLoginResult = {
  type: string;
  token?: string;
  expires?: number;
};

export type FacebookOptions = {
  permissions?: string[];
  behavior?: 'web' | 'native' | 'browser' | 'system';
};
