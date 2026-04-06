export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

export function isValidPassword(password: string): boolean {
  const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$/;
  return passwordRegex.test(password);
}

export function isValidSaudiPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, '');
  if (cleaned.length === 10 && cleaned.startsWith('05')) return true;
  if (cleaned.length === 9 && cleaned.startsWith('5')) return true;
  return false;
}
