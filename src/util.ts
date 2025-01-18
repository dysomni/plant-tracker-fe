// generic function that ensures that the value is not null or undefined
export const unwrap = <T>(value: T | null | undefined): T => {
  if (value === null || value === undefined) {
    throw new Error("Value is null or undefined");
  }
  return value;
};

export const pluralize = (count: number, singular: string, plural: string) =>
  count === 1 ? singular : plural;

export const removeTimeZoneBracketFromDatetime = (datetime: string) => {
  // example 2025-01-18T01:14:08.882-05:00[America/New_York]
  return datetime.replace(/\[.*\]/, "").trim();
};
