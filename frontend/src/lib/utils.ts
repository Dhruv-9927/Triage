import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | number) {
  return format(new Date(date), 'PPP');
}

export function formatTime(date: Date | string | number) {
  return format(new Date(date), 'p');
}

export function formatRelativeTime(date: Date | string | number) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatIndianNumber(num: number) {
  return new Intl.NumberFormat('en-IN').format(num);
}

export function getUrgencyColor(level: string) {
  switch (level?.toLowerCase()) {
    case 'emergency': return 'bg-red-600 text-white';
    case 'urgent': return 'bg-orange-500 text-white';
    case 'routine': return 'bg-blue-500 text-white';
    case 'selfcare': return 'bg-green-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
}

export function getUrgencyEmoji(level: string) {
  switch (level?.toLowerCase()) {
    case 'emergency': return '🚨';
    case 'urgent': return '⚠️';
    case 'routine': return '🩺';
    case 'selfcare': return '🍵';
    default: return 'ℹ️';
  }
}

export function getUrgencyLabel(level: string) {
  switch (level?.toLowerCase()) {
    case 'emergency': return 'Emergency';
    case 'urgent': return 'Urgent';
    case 'routine': return 'Routine';
    case 'selfcare': return 'Self Care';
    default: return 'Unknown';
  }
}
