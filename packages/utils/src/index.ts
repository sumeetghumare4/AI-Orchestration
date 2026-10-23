export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function formatDate(date: Date): string {
  return date.toISOString();
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
