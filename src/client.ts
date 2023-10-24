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
  lastChecked: number;
  price: number;
  soldInLastWeek: number;
  tradeable?: boolean;
};

export type Prices = Record<number, Price>;

export async function fetchPrices(): Promise<Prices> {
  const response = await fetch(
    "https://raw.githubusercontent.com/libraryaddict/KolItemPrices/master/data/irrats_item_prices.txt",
  );
  const data = await response.text();

  // Slice the first line since it contains last updated, which is better calculated per item
  const lines = data.split("\n").slice(1);

  return Object.fromEntries(
    lines
      .filter((l) => !l.startsWith("#"))
      .map((l) => l.split("\t"))
      .filter((p) => p.length >= 4)
      .map((p) => p.slice(0, 4).map(Number))
      .map(([id, lastChecked, price, soldInLastWeek]) => [
        id,
        {
          lastChecked: lastChecked * 1000,
          price,
          soldInLastWeek,
        } satisfies Price,
      ]),
  );
}
