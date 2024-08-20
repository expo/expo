import type { Menu, Page } from './types';

export async function getMenu(handle: string): Promise<Menu[]> {
  return fetch('/api/get-menu?handle=' + handle).then((res) => res.json());
}

export function getPage(handle: string): Promise<Page> {
  return fetch('/api/get-page?handle=' + handle).then((res) => res.json());
}

export function getProduct(handle: string) {
  return fetch('/api/get-product?handle=' + handle).then((res) => res.json());
}

export function getProductRecommendations(handle: string) {
  return fetch('/api/get-product-rec?handle=' + handle).then((res) => res.json());
}
