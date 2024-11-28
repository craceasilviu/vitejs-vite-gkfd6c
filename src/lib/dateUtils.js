import { startOfWeek, addWeeks, getISOWeek, getYear, addDays } from 'date-fns';

// Get current week number (ISO week)
export function getCurrentWeek() {
  const now = new Date();
  const currentWeek = getISOWeek(now);
  const currentYear = getYear(now);
  
  // Only allow submissions for 2 weeks ahead
  const submissionWeek = currentWeek + 2;
  
  return {
    current: currentWeek,
    next: submissionWeek,
    year: currentYear
  };
}

// Get dates for each day of a specific week
export function getWeekDates(weekNumber, year = new Date().getFullYear()) {
  // Find the first day of the year
  const firstDayOfYear = new Date(year, 0, 1);
  
  // Get the start of the first week
  let firstWeek = startOfWeek(firstDayOfYear, { weekStartsOn: 0 }); // 0 = Sunday
  
  // Add weeks until we reach the target week
  const targetWeek = addWeeks(firstWeek, weekNumber - 1);
  
  // Generate array of dates for the week
  const dates = [];
  for (let i = 0; i < 7; i++) {
    dates.push(addDays(targetWeek, i));
  }
  
  return dates;
}

// Create a map of days to dates for a given week
export function createDayDateMap(weekDates) {
  if (!weekDates || weekDates.length !== 7) return {};
  
  return Object.fromEntries(
    DAYS_OF_WEEK.map((day, index) => [
      day,
      weekDates[index].toISOString()
    ])
  );
}

export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];