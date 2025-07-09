import GithubSlugger from 'github-slugger';
import { createContext } from 'react';

export const AnchorContext = createContext<GithubSlugger | null>(null);
