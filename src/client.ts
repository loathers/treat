// If it's stupid and works it ain't stupid
export const assumeRoundings = (num: number) => {
  switch (num) {
    case 0.3:
      return 1 / 3;
    case 0.16:
      return 1 / 6;
    case 0.08:
      return 1 / 12;
    case 0.09:
      return 1 / 11;
    case 0.91:
      return 10 / 11;
    default:
      return num;
  }
};

export type Price = {
  value: number;
  volume: number;
  date: Date;
  itemId: number;
  tradeable?: boolean;
};

export type Prices = Record<number, Price>;

export async function fetchPrices(ids: number[]): Promise<Prices> {
  const response = await fetch(
    `https://pricegun.loathers.net/api/${ids.join(",")}`,
  );
  const results = (await response.json()) as Price[];
  return Object.fromEntries(
    results.map((r) => [r.itemId, { ...r, date: new Date(r.date) }]),
  );
}
