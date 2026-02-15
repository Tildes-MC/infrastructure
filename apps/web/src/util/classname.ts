/**
 * Combines multiple class names into a single space-separated string, filtering out falsy values.
 * @param names CSS class names
 * @returns Value for a `className` JSX property
 */
export function cn(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(" ");
}
