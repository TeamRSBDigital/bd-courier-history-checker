export function normalizeBangladeshiPhone(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const compact = input.trim().replace(/[\s()-]/g, '');
  let local = compact;
  if (local.startsWith('+880')) local = `0${local.slice(4)}`;
  else if (local.startsWith('880')) local = `0${local.slice(3)}`;
  else if (/^1[3-9]\d{8}$/.test(local)) local = `0${local}`;
  if (!/^01[3-9]\d{8}$/.test(local)) return null;
  return local;
}

export function maskPhone(phone: string): string {
  if (!/^01[3-9]\d{8}$/.test(phone)) return '***********';
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}
