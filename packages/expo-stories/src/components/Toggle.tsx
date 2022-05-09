import * as React from 'react';
import { TouchableOpacity } from 'react-native';

type ToggleContextProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

const ToggleContext = React.createContext<ToggleContextProps>({
  isOpen: false,
  setIsOpen: () => {},
});

function Container({ children }) {
  const [isOpen, setIsOpen] = React.useState(false);

  return <ToggleContext.Provider value={{ isOpen, setIsOpen }}>{children}</ToggleContext.Provider>;
}

function Area({ children }) {
  const { isOpen } = React.useContext(ToggleContext);

  if (!isOpen) {
    return null;
  }

  return <>{children}</>;
}

function Button({ children }) {
  const { isOpen, setIsOpen } = React.useContext(ToggleContext);

  return <TouchableOpacity onPress={() => setIsOpen(!isOpen)}>{children}</TouchableOpacity>;
}

export const Toggle = {
  Container,
  Button,
  Area,
};
