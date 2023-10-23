import {
  CellContext,
  ColumnDef,
  RowData,
  createColumnHelper,
} from "@tanstack/react-table";
import { Heading, Stack, Text, Image } from "@chakra-ui/react";

import { Outfit, Price, Treat } from "../client";

import { DataTable } from "./DataTable";

declare module "@tanstack/table-core" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface ColumnMeta<TData extends RowData, TValue> {
    isNumeric: boolean;
  }
}

interface PricedOutfit extends Outfit {
  treats: (Treat & { price: Price | null })[];
  averageTreatValue: number;
}

const numberFormat = Intl.NumberFormat();
const formatMeat = (price: number | undefined) =>
  `${price ? numberFormat.format(Math.round(price)) : "Unknown"} Meat`;

const formatPricedTreat = (t: PricedOutfit["treats"][number]) => {
  const metadata =
    t.price && t.price.tradeable
      ? [
          formatMeat(t.price.price),
          `${numberFormat.format(
            t.price.soldInLastWeek ?? 0,
          )} solid in last week`,
        ]
      : [];
  if (t.chance !== 1)
    metadata.push(`${Number((t.chance * 100).toFixed(2))}% chance`);
  const result = [t.item];
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
          {info.getValue()}
        </Heading>
        <Text fontSize="xs">{info.row.original.equipment.join(", ")}</Text>
      </Stack>
    ),
    header: "Name",
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
};

export function OutfitTable({ outfits, prices }: Props) {
  const data = outfits.map((o) => ({
    ...o,
    treats: o.treats.map((t) => ({ ...t, price: prices[t.item] || null })),
    averageTreatValue:
      o.treats.length < 1
        ? -1
        : o.treats.reduce(
            (sum, t) => sum + (prices[t.item]?.price ?? 0) * t.chance,
            0,
          ),
  })) satisfies PricedOutfit[];

  return <DataTable columns={columns} data={data} />;
}
