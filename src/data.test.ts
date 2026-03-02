import { describe, expect, it } from "vitest";
import { extractItemMeta, toOutfit, type RawOutfit } from "./data";

function rawOutfit(overrides = {}): RawOutfit {
  return {
    name: "Test Outfit",
    image: "test.gif",
    outfitEquipmentsByOutfit: { nodes: [] },
    outfitTreatsByOutfit: { nodes: [] },
    ...overrides,
  } as unknown as RawOutfit;
}

describe("toOutfit", () => {
  it("maps name and image", () => {
    const result = toOutfit(rawOutfit({ name: "Cool Outfit", image: "cool.gif" }));
    expect(result.name).toBe("Cool Outfit");
    expect(result.image).toBe("cool.gif");
  });

  it("maps equipment names", () => {
    const result = toOutfit(
      rawOutfit({
        outfitEquipmentsByOutfit: {
          nodes: [
            { itemByEquipment: { name: "Cool Hat" } },
            { itemByEquipment: { name: "Cool Shirt" } },
          ],
        },
      }),
    );
    expect(result.equipment).toEqual(["Cool Hat", "Cool Shirt"]);
  });

  it("falls back to empty string for null equipment name", () => {
    const result = toOutfit(
      rawOutfit({
        outfitEquipmentsByOutfit: {
          nodes: [{ itemByEquipment: null }],
        },
      }),
    );
    expect(result.equipment).toEqual([""]);
  });

  it("maps treats with item name and chance", () => {
    const result = toOutfit(
      rawOutfit({
        outfitTreatsByOutfit: {
          nodes: [
            { chance: 0.5, itemByItem: { id: 1, name: "Candy Corn", tradeable: true } },
            { chance: 1, itemByItem: { id: 2, name: "Lollipop", tradeable: false } },
          ],
        },
      }),
    );
    expect(result.treats).toEqual([
      { item: "Candy Corn", chance: 0.5 },
      { item: "Lollipop", chance: 1 },
    ]);
  });

  it("falls back to empty string for null treat item name", () => {
    const result = toOutfit(
      rawOutfit({
        outfitTreatsByOutfit: {
          nodes: [{ chance: 1, itemByItem: null }],
        },
      }),
    );
    expect(result.treats).toEqual([{ item: "", chance: 1 }]);
  });
});

describe("extractItemMeta", () => {
  it("returns empty object for no outfits", () => {
    expect(extractItemMeta([])).toEqual({});
  });

  it("returns empty object for outfits with no treats", () => {
    expect(extractItemMeta([rawOutfit()])).toEqual({});
  });

  it("extracts id and tradeable keyed by name", () => {
    const result = extractItemMeta([
      rawOutfit({
        outfitTreatsByOutfit: {
          nodes: [
            { chance: 1, itemByItem: { id: 42, name: "Candy Corn", tradeable: true } },
          ],
        },
      }),
    ]);
    expect(result).toEqual({ "Candy Corn": { id: 42, tradeable: true } });
  });

  it("defaults tradeable to false when null", () => {
    const result = extractItemMeta([
      rawOutfit({
        outfitTreatsByOutfit: {
          nodes: [{ chance: 1, itemByItem: { id: 1, name: "Mystery Candy", tradeable: null } }],
        },
      }),
    ]);
    expect(result["Mystery Candy"].tradeable).toBe(false);
  });

  it("skips treats with null itemByItem", () => {
    const result = extractItemMeta([
      rawOutfit({
        outfitTreatsByOutfit: {
          nodes: [{ chance: 1, itemByItem: null }],
        },
      }),
    ]);
    expect(result).toEqual({});
  });

  it("collects treats across multiple outfits", () => {
    const result = extractItemMeta([
      rawOutfit({
        outfitTreatsByOutfit: {
          nodes: [{ chance: 1, itemByItem: { id: 1, name: "Apple", tradeable: true } }],
        },
      }),
      rawOutfit({
        outfitTreatsByOutfit: {
          nodes: [{ chance: 1, itemByItem: { id: 2, name: "Banana", tradeable: false } }],
        },
      }),
    ]);
    expect(result).toEqual({
      Apple: { id: 1, tradeable: true },
      Banana: { id: 2, tradeable: false },
    });
  });
});
