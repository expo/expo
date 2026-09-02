export type Message = {
  content: string;
  substitutions: {
    length: number;
    offset: number;
  }[];
};

export type CodeFrame = {
  content: string;
  location?: {
    row: number;
    column: number;
    [key: string]: any;
  } | null;
  fileName: string;
  collapse?: boolean;
};

export type LogLevel = 'error' | 'fatal' | 'syntax' | 'resolution' | 'static';

export type LogBoxLogDataLegacy = {
  level: LogLevel;
  type?: string;
  message: Message;
  stack: MetroStackFrame[];
  category: string;
  componentStack: CodeFrame[];
  codeFrame?: CodeFrame;
  isComponentError: boolean;
};

export type MetroStackFrame = {
  file: string | null;
  methodName: string;
  lineNumber?: number | null;
  column?: number | null;
  collapse?: boolean;
};
