// The term and year the app treats as "now". This is the same month-based rule the server and the
// teacher Attendance and Assignments pages save under, so a student's pages open on the term that
// actually has data instead of an empty Term 1.
export function currentTermYear(date = new Date()) {
  return { term: Math.ceil((date.getMonth() + 1) / 4), year: date.getFullYear() };
}
