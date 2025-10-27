import { type StackFrame as UpstreamStackFrame } from 'stacktrace-parser';

export type Message = {
  content: string;
  substitutions: {
    length: number;
    offset: number;
  }[];
};

export type Category = string;

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

export type SymbolicationStatus = 'NONE' | 'PENDING' | 'COMPLETE' | 'FAILED';

export type LogLevel = 'error' | 'fatal' | 'syntax' | 'resolution' | 'static';

export type StackType = 'stack' | 'component';

export type LogBoxLogData = {
  level: LogLevel;
  type?: string;
  message: Message;
  stack: MetroStackFrame[];
  category: string;
  componentStack: MetroStackFrame[];
  codeFrame: Partial<Record<StackType, CodeFrame>>;
  isComponentError: boolean;
  isMissingModuleError?: string;
  extraData?: Record<string, unknown>;
};

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

export type MetroStackFrame = Omit<UpstreamStackFrame, 'arguments'> & { collapse?: boolean };
