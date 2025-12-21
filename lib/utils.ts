import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toStartOfDayIso(date: Date) {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return start.toISOString();
}

export function dateInputToStartOfDayIso(value: string) {
    if (!value) return toStartOfDayIso(new Date());
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return toStartOfDayIso(new Date());
    return toStartOfDayIso(new Date(year, month - 1, day));
}
