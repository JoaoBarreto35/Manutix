export function formatDateTime(value: string | null): string {
  if (!value) return "Não definido";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatMinutes(minutes: number | null): string {
  if (!minutes || minutes <= 0) return "0min";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${remainingMinutes}min`;
  if (remainingMinutes === 0) return `${hours}h`;

  return `${hours}h ${remainingMinutes}min`;
}

export function getDefaultStartDateTime(): string {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 30);

  return date.toISOString().slice(0, 16);
}

export function getDefaultEndDateTime(): string {
  const date = new Date();
  date.setHours(date.getHours() + 2);

  return date.toISOString().slice(0, 16);
}

export function toIsoFromLocalInput(value: string): string {
  return new Date(value).toISOString();
}

export function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) return "-";

  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
