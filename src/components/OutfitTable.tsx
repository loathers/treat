import {
  CellContext,
  ColumnDef,
  RowData,
  createColumnHelper,
} from "@tanstack/react-table";
import { Heading, Stack, Text, Image } from "@chakra-ui/react";

import { DataTable } from "./DataTable";
import { decodeHTML } from "entities";
import { Price, assumeRoundings } from "../client";
import { type Outfit, type OutfitTreat } from "../data";

declare module "@tanstack/table-core" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface ColumnMeta<TData extends RowData, TValue> {
    isNumeric: boolean;
  }
}

interface PricedTreat extends OutfitTreat {
  price: Price | null;
}

interface PricedOutfit {
  id: number;
  name: string;
  image: string;
  equipment: string[];
  treats: PricedTreat[];
  averageTreatValue: number;
}

const numberFormat = Intl.NumberFormat();
const formatMeat = (price: number | undefined) =>
  `${price ? numberFormat.format(Math.round(price)) : "Unknown"} Meat`;

const formatPricedTreat = (t: PricedTreat) => {
  const metadata =
    t.price && t.price.tradeable
      ? [
          formatMeat(t.price.value),
          `${numberFormat.format(t.price.volume ?? 0)} sold in last two weeks`,
        ]
      : [];
  if (t.chance !== 1)
    metadata.push(
      `${Number((assumeRoundings(t.chance) * 100).toFixed(2))}% chance`,
    );
  const result = [decodeHTML(t.item.name)];
  if (metadata.length > 0) result.push(`(${metadata.join(", ")})`);
  return result.join(" ");
};

const formatAverageValue = (info: CellContext<PricedOutfit, number>) => {
  if (info.row.original.treats.length < 1) return "No candy";
  if (!info.row.original.treats.some((t) => t.price?.tradeable))
    return "Untradeable";
  return formatMeat(info.getValue());
};

const columnHelper = createColumnHelper<PricedOutfit>();

const columns = [
  columnHelper.accessor("image", {
    cell: (info) => (
      <Image
        minWidth={10}
        src={`https://s3.amazonaws.com/images.kingdomofloathing.com/otherimages/sigils/${info.getValue()}`}
      />
    ),
    header: "",
    enableSorting: false,
  }),
  columnHelper.accessor("name", {
    cell: (info) => (
      <Stack>
        <Heading as="h3" size="sm">
          {decodeHTML(info.getValue())}
        </Heading>
        <Text fontSize="xs">
          {info.row.original.equipment.map(decodeHTML).join(", ")}
        </Text>
      </Stack>
    ),
    header: "Name",
    sortingFn: "text",
  }),
  columnHelper.accessor("averageTreatValue", {
    cell: (info) => (
      <Stack>
        <Text>{formatAverageValue(info)}</Text>
        <Text fontSize="xs">
          {info.row.original.treats.map(formatPricedTreat).join(", ")}
        </Text>
      </Stack>
    ),
    meta: { isNumeric: true },
    header: "Candies",
  }),
  // https://github.com/TanStack/table/issues/4241
] as unknown as ColumnDef<PricedOutfit>[];

type Props = {
  outfits: Outfit[];
  prices: Record<string, Price>;
  loading: boolean;
};

export function OutfitTable({ outfits, prices, loading }: Props) {
  const data = outfits.map((o) => {
    const treats = o.treats.getItems();
    return {
      id: o.id,
      name: o.name,
      image: o.image,
      equipment: o.equipment.getItems().map((item) => item.name),
      treats: treats.map((t) => ({ ...t, price: prices[t.item.name] || null })),
      averageTreatValue:
        treats.length < 1
          ? -1
          : treats.reduce(
              (sum, t) => sum + (prices[t.item.name]?.value ?? 0) * t.chance,
              0,
            ),
    };
  }) satisfies PricedOutfit[];

  return (
    <DataTable
      columns={columns}
      data={data}
      initialSort={[{ id: "name", desc: false }]}
      loading={loading}
    />
  );
}
