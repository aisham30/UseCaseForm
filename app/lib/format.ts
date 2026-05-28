export function formatRequestNumber(id: number | string) {
  return `REQ-${String(id).padStart(5, "0")}`;
}