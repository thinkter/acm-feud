export function normalizeKeyLabel(value: string) {
  return value.trim().slice(0, 1).toUpperCase();
}

export function keyMatches(eventKey: string, expected: string) {
  return eventKey.toUpperCase() === expected.toUpperCase();
}
