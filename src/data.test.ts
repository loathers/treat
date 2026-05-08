import { describe, expect, it, vi } from "vitest";
import { buildItemNameToPrice } from "./data";

vi.mock("./client", () => ({
  fetchPrices: vi.fn(),
}));

import { fetchPrices } from "./client";

type OutfitInput = Parameters<typeof buildItemNameToPrice>[0][number];

function makeCollection<T>(items: T[]) {
  return { getItems: () => items };
}

function makeTreat(id: number, name: string, tradeable: boolean, chance = 1) {
  return { chance, item: { id, name, tradeable } };
}

function makeOutfit(treats: ReturnType<typeof makeTreat>[]): OutfitInput {
  return {
    treats: makeCollection(treats),
    equipment: makeCollection([]),
  } as unknown as OutfitInput;
}

const basePrice = { value: 1000, volume: 50, date: new Date(), itemId: 1 };

describe("buildItemNameToPrice", () => {
  it("returns empty object for outfits with no treats", async () => {
    vi.mocked(fetchPrices).mockResolvedValue({});
    expect(await buildItemNameToPrice([makeOutfit([])])).toEqual({});
  });

  it("fetches prices for treat item ids", async () => {
    vi.mocked(fetchPrices).mockResolvedValue({});
    await buildItemNameToPrice([makeOutfit([makeTreat(42, "Candy Corn", true)])]);
    expect(fetchPrices).toHaveBeenCalledWith([42]);
  });

  it("keys prices by item name", async () => {
    vi.mocked(fetchPrices).mockResolvedValue({ 42: basePrice });
    const result = await buildItemNameToPrice([
      makeOutfit([makeTreat(42, "Candy Corn", true)]),
    ]);
    expect(result["Candy Corn"]).toMatchObject({ value: 1000, volume: 50 });
  });

  it("merges tradeable from item into the price", async () => {
    vi.mocked(fetchPrices).mockResolvedValue({ 1: basePrice, 2: { ...basePrice, itemId: 2 } });
    const result = await buildItemNameToPrice([
      makeOutfit([makeTreat(1, "Apple", true), makeTreat(2, "Rock", false)]),
    ]);
    expect(result["Apple"].tradeable).toBe(true);
    expect(result["Rock"].tradeable).toBe(false);
  });

  it("collects treats across multiple outfits", async () => {
    vi.mocked(fetchPrices).mockResolvedValue({
      1: basePrice,
      2: { ...basePrice, itemId: 2 },
    });
    const result = await buildItemNameToPrice([
      makeOutfit([makeTreat(1, "Apple", true)]),
      makeOutfit([makeTreat(2, "Banana", false)]),
    ]);
    expect(Object.keys(result)).toEqual(expect.arrayContaining(["Apple", "Banana"]));
  });
});
