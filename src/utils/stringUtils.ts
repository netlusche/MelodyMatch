export const normalizeString = (str: string) => {
  if (!str) return "";
  return str.toLowerCase()
    .replace(/\(.*?\)/g, '') // remove anything in parentheses
    .replace(/\[.*?\]/g, '') // remove anything in brackets
    .replace(/\s-.*?$/g, '') // remove anything after a spaced hyphen
    .replace(/feat\..*|ft\..*/g, '') // remove featuring artists
    .replace(/[^a-z0-9]/g, '') // strip all remaining punctuation and whitespace
    .trim();
};
