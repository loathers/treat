import { createClient } from "data-of-loathing";

import { fetchPrices, Price } from "./client";

const client = createClient();

async function fetchRawOutfits() {
  const result = await client.query({
    allOutfits: {
      __args: { first: 1000 },
      nodes: {
        name: true,
        image: true,
        outfitEquipmentsByOutfit: {
          nodes: { itemByEquipment: { name: true } },
        },
        outfitTreatsByOutfit: {
          nodes: {
            chance: true,
            itemByItem: { id: true, name: true, tradeable: true },
          },
        },
      },
    },
  });
  return result.allOutfits?.nodes?.filter((x) => x !== null) ?? [];
}

export type RawOutfit = Awaited<ReturnType<typeof fetchRawOutfits>>[number];

export function toOutfit(o: RawOutfit) {
  return {
    name: o.name,
    image: o.image,
    equipment: (o.outfitEquipmentsByOutfit?.nodes?.filter((x) => x !== null) ?? []).map(
      (e) => e.itemByEquipment?.name ?? "",
    ),
    treats: (o.outfitTreatsByOutfit?.nodes?.filter((x) => x !== null) ?? []).map((t) => ({
      item: t.itemByItem?.name ?? "",
      chance: t.chance,
    })),
  };
}

export function extractItemMeta(rawOutfits: RawOutfit[]) {
  return Object.fromEntries(
    rawOutfits
      .flatMap((o) => o.outfitTreatsByOutfit?.nodes?.filter((x) => x !== null) ?? [])
      .flatMap((t) => {
        const item = t.itemByItem;
        return item?.name && item.id != null
          ? [[item.name, { id: item.id, tradeable: item.tradeable ?? false }]]
          : [];
      }),
  );
}

async function buildItemNameToPrice(
  itemMeta: ReturnType<typeof extractItemMeta>,
): Promise<Record<string, Price>> {
  const ids = Object.values(itemMeta).map((m) => m.id);
  const prices = await fetchPrices(ids);
  return Object.fromEntries(
    Object.entries(itemMeta).map(([name, { id, tradeable }]) => [
      name,
      { ...prices[id], tradeable },
    ]),
  );
}

export type Outfit = ReturnType<typeof toOutfit>;
export type OutfitTreat = Outfit["treats"][number];

export async function loadOutfitData() {
  const rawOutfits = await fetchRawOutfits();
  return {
    outfits: rawOutfits.map(toOutfit),
    itemNameToPrice: await buildItemNameToPrice(extractItemMeta(rawOutfits)),
  };
}
