/**
 * Validation utilities for forms
 */

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

export function isValidHexColor(hex: string): boolean {
  const hexRegex = /^#[0-9A-Fa-f]{6}$/;
  return hexRegex.test(hex);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isPositiveNumber(value: string | number): boolean {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && num > 0;
}

export function isValidDate(date: string): boolean {
  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
}

export function isFutureDate(date: string): boolean {
  const parsed = new Date(date);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return parsed > now;
}

export function validateInvoiceItem(item: { description: string; quantity: number; unitPrice: number }) {
  const errors: string[] = [];
  
  if (!item.description?.trim()) {
    errors.push('Description is required');
  }
  
  if (!isPositiveNumber(item.quantity)) {
    errors.push('Quantity must be greater than 0');
  }
  
  if (!isPositiveNumber(item.unitPrice)) {
    errors.push('Unit price must be greater than 0');
  }
  
  return errors;
}
