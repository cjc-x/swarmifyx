type TranslateFn = (text: string, values?: Record<string, string | number>) => string;

export function translateQuotaWindowLabel(label: string, t: TranslateFn): string {
  const [prefix, ...rest] = label.split(" · ");
  if (rest.length === 0) return t(label);
  return `${prefix} · ${translateQuotaWindowLabel(rest.join(" · "), t)}`;
}

export function translateQuotaWindowValueLabel(valueLabel: string | null, t: TranslateFn): string | null {
  if (!valueLabel) return null;
  const remainingMatch = valueLabel.match(/^(?<amount>.+?) remaining$/u);
  if (remainingMatch?.groups?.amount) {
    return t("{amount} remaining", { amount: remainingMatch.groups.amount });
  }
  return t(valueLabel);
}

export function translateQuotaWindowDetail(detail: string | null, t: TranslateFn): string | null {
  if (!detail) return null;
  if (detail.startsWith("Resets ")) {
    return t("Resets {time}", { time: detail.slice("Resets ".length) });
  }
  return t(detail);
}
