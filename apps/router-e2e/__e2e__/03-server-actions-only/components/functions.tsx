'use server';

import React from 'react';
import { ClientOne } from './client-one';

export async function renderPage() {
  // await new Promise((resolve) => setTimeout(resolve, 1000));
  return <ClientOne />;
}

export async function getResults() {
  return 'Two!';
}
