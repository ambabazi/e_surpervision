/** UoK student registration: YYYYTTNNNNNN (12 digits, e.g. 202305000078) */
export const EXAMPLE_REG_NUMBER = "202305000078";

export function formatRegNumberInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, 12);
}
