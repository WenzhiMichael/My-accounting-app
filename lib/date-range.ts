import {
  endOfMonth,
  endOfWeek,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
} from "date-fns"

export type DateRangeKey = "week" | "month"

export function getDateRange(key: DateRangeKey, baseDate: Date = new Date()) {
  if (key === "week") {
    return {
      start: startOfWeek(baseDate, { weekStartsOn: 1 }),
      end: endOfWeek(baseDate, { weekStartsOn: 1 }),
    }
  }

  return {
    start: startOfMonth(baseDate),
    end: endOfMonth(baseDate),
  }
}

export function isWithinDateRange(date: Date, range: { start: Date; end: Date }) {
  return isWithinInterval(date, range)
}
