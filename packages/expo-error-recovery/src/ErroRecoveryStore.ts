let recoveredPropsToSave: string | null = null;

export function getRecoveryPropsToSave(): string | null {
  return recoveredPropsToSave;
}

export function setRecoveryPropsToSave(props: { [key: string]: any }): void {
  recoveredPropsToSave = JSON.stringify(props);
}
