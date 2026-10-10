// Ghana school calendar: Term 1 = Sep-Dec, Term 2 = Jan-Apr, Term 3 = May-Aug.
// The year is the academic year's starting year (Jan 2027 is in 2026/2027, so year 2026).
// The server derives the same term from each attendance date, so pages open on the term that has data.
export function currentTermYear(date = new Date()) {
  const m = date.getMonth() + 1;
  return {
    term: m >= 9 ? 1 : m <= 4 ? 2 : 3,
    year: m >= 9 ? date.getFullYear() : date.getFullYear() - 1,
  };
}
