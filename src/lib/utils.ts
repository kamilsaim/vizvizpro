import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(amount);
}

export function getQueenColor(year: number) {
  const lastDigit = year % 10;
  if ([1, 6].includes(lastDigit)) return { name: 'Beyaz', class: 'bg-white text-slate-900 border-slate-200', hex: '#FFFFFF' };
  if ([2, 7].includes(lastDigit)) return { name: 'Sarı', class: 'bg-yellow-400 text-yellow-900', hex: '#FACC15' };
  if ([3, 8].includes(lastDigit)) return { name: 'Kırmızı', class: 'bg-red-500 text-white', hex: '#EF4444' };
  if ([4, 9].includes(lastDigit)) return { name: 'Yeşil', class: 'bg-green-500 text-white', hex: '#22C55E' };
  if ([5, 0].includes(lastDigit)) return { name: 'Mavi', class: 'bg-blue-500 text-white', hex: '#3B82F6' };
  return { name: 'Bilinmiyor', class: 'bg-slate-200 text-slate-500', hex: '#E2E8F0' };
}
