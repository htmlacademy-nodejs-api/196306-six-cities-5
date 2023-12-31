export function parseAsInteger(param: unknown): number | null {
  if (typeof param !== 'string') {
    return null;
  }

  const parsedParam = Number.parseInt(param, 10);

  return Number.isInteger(parsedParam) ? parsedParam : null;
}
