import { createClient, Outfit, OutfitTreat } from "data-of-loathing";

import { fetchPrices, Price } from "./client";

export type { Outfit, OutfitTreat };

const client = createClient();

export async function fetchOutfits() {
  await client.load();
  return client.query.findAll(Outfit, {
    populate: ["equipment", "treats", "treats.item"],
  });
}

export async function buildItemNameToPrice(
  outfits: Awaited<ReturnType<typeof fetchOutfits>>,
): Promise<Record<string, Price>> {
  const itemMap = Object.fromEntries(
    outfits
      .flatMap((o) => o.treats.getItems())
      .map((t) => [t.item.name, { id: t.item.id, tradeable: t.item.tradeable }]),
  );
  const prices = await fetchPrices(Object.values(itemMap).map((m) => m.id));
  return Object.fromEntries(
    Object.entries(itemMap).map(([name, { id, tradeable }]) => [
      name,
      { ...prices[id], tradeable },
    ]),
  );
}

export async function loadOutfitData() {
  const outfits = await fetchOutfits();
  return {
    outfits,
    itemNameToPrice: await buildItemNameToPrice(outfits),
  };
}
