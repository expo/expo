"use server";
export async function mappedAction() {
  try {
    throw new Error('mapped action error');
  } catch (error) {
    return { stack: (error as Error).stack };
  }
}
