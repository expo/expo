import { Themes } from '@expo/styleguide';
import { createContext, type Dispatch, type PropsWithChildren, useContext } from 'react';

import { useLocalStorage } from '~/common/useLocalStorage';

type CodeBlockSettingsContextType = {
  preferredTheme: Themes;
  setPreferredTheme: Dispatch<Themes>;
  wordWrap: boolean;
  setWordWrap: Dispatch<boolean>;
};

export const CodeBlockSettingsContext = createContext<CodeBlockSettingsContextType>({
  preferredTheme: Themes.AUTO,
  setPreferredTheme: (_: Themes) => {},
  wordWrap: false,
  setWordWrap: (_: boolean) => {},
});

export function CodeBlockSettingsProvider({ children }: PropsWithChildren) {
  const [preferredTheme, setPreferredTheme] = useLocalStorage({
    defaultValue: Themes.AUTO,
    name: 'CODEBLOCK_THEME',
  });
  const [wordWrap, setWordWrap] = useLocalStorage({
    defaultValue: false,
    name: 'CODEBLOCK_WORDWRAP',
  });

  return (
    <CodeBlockSettingsContext.Provider
      value={{
        preferredTheme,
        setPreferredTheme,
        wordWrap,
        setWordWrap,
      }}>
      {children}
    </CodeBlockSettingsContext.Provider>
  );
}

export function useCodeBlockSettingsContext() {
  return useContext(CodeBlockSettingsContext);
}
