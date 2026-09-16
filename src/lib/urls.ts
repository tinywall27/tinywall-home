import { siteMetadata } from '../data/site';

export function isExternalUrl(url?: string): boolean {
  return Boolean(url && new URL(url, siteMetadata.url).origin !== new URL(siteMetadata.url).origin);
}

export function siteHref(url: string): string {
  const parsed = new URL(url, siteMetadata.url);
  return isExternalUrl(url) ? url : `${parsed.pathname}${parsed.search}${parsed.hash}`;
}
