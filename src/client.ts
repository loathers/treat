import { decodeHTML } from "entities";

const MAFIA_DATA_BASE =
  "https://raw.githubusercontent.com/kolmafia/kolmafia/main/src/data";

export async function loadMafiaData(fileName: string, lastKnownSize = 0) {
  const url = `${MAFIA_DATA_BASE}/${fileName}.txt`;
  if (lastKnownSize > 0) {
    const sizeCheck = await fetch(url, { method: "HEAD" });
    const newSize = Number(sizeCheck.headers.get("Content-Length") ?? 1);
    if (newSize === lastKnownSize) return null;
  }

  const request = await fetch(url);
  const raw = await request.text();
  return {
    data: raw
      .split("\n")
      .slice(1)
      .filter((r) => r !== "" && !r.startsWith("#"))
      .map((r) => r.split("\t")),
    size: Number(request.headers.get("Content-Length")),
  };
}

const parseEquipment = (equipmentList = "") =>
  equipmentList.trim().split(", ").map(decodeHTML);

// If it's stupid and works it ain't stupid
const assumeRoundings = (num: number) => {
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
const parseTreats = (treatList = "") =>
  treatList
    .trim()
    .split(", ")
    .filter((t) => t !== "none")
    .map((treat) => {
      const m = treat.match(/^(.*?) \((\d*\.?\d+)\)$/);
      if (!m) return { item: decodeHTML(treat), chance: 1 };
      return { item: decodeHTML(m[1]), chance: assumeRoundings(Number(m[2])) };
    });

export type Treat = {
  item: string;
  chance: number;
};
export type Outfit = {
  id: number;
  name: string;
  image: string;
  equipment: string[];
  treats: Treat[];
};

export async function fetchOutfits(): Promise<Outfit[]> {
  const data = (await loadMafiaData("outfits"))?.data ?? [];

  return data
    .filter((d) => d.length > 1)
    .map(([id, name, image, equipment, treats]) => ({
      id: Number(id),
      name,
      image,
      equipment: parseEquipment(equipment),
      treats: parseTreats(id === "80" ? "double-ice gum" : treats),
    }))
    .toSorted((a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1));
}

export async function fetchItems() {
  const response = await loadMafiaData("items");
  if (!response) return {};

  return Object.fromEntries(
    response.data
      .filter((d) => d.length > 2)
      .map(([id, name, , , , access]) => [
        name,
        { id: Number(id), tradeable: access.split(",").includes("t") },
      ]),
  );
}

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
