/** A CLI subcommand. `argv` holds the arguments after the subcommand name. */
export type Command = (argv?: string[]) => void;
