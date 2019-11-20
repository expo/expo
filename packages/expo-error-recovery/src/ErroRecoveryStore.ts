let recoveredPropsToSave: String | null = null;

export function getRecoveryPropsToSave(): String | null {
  return recoveredPropsToSave;
}

export function setRecoveryPropsToSave(props: { [key: string]: any }): void {
  recoveredPropsToSave = JSON.stringify(props);
}
