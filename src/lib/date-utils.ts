export function formatDateInputValue(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function formatDateHeading(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
