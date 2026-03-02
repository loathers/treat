import {
  ChakraProvider,
  defaultSystem,
  Heading,
  Stack,
  Text,
  Container,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { ItemType, loadItems, loadOutfits, OutfitType } from "data-of-loathing";

import { Prices, fetchPrices } from "../client";
import { OutfitTable } from "./OutfitTable";

function App() {
  const [loading, setLoading] = useState(false);
  const [outfits, setOutfits] = useState<OutfitType[]>([]);
  const [items, setItems] = useState<ItemType[]>([]);
  const [prices, setPrices] = useState<Prices>({});

  const itemNameToItem = useMemo(
    () =>
      items.reduce(
        (acc, item) => ({ ...acc, [item.name]: item }),
        {} as Record<string, ItemType>,
      ),
    [items],
  );

  useEffect(() => {
    async function load() {
      setLoading(true);
      setOutfits((await loadOutfits())?.data ?? []);
      setItems((await loadItems())?.data ?? []);
      setLoading(false);
    }

    load();
  }, []);

  useEffect(() => {
    async function load() {
      if (Object.keys(itemNameToItem).length === 0) return;
      if (outfits.length === 0) return;

      const ids = outfits
        .flatMap((o) => o.treats.map((t) => t.item))
        .map((name) => itemNameToItem[name]?.id);
      setPrices(await fetchPrices(ids));
    }

    load();
  }, [outfits, itemNameToItem]);

  const itemNameToPrice = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(itemNameToItem).map(([name, { id, tradeable }]) => [
          name,
          { ...prices[id], tradeable },
        ]),
      ),
    [itemNameToItem, prices],
  );

  return (
    <ChakraProvider value={defaultSystem}>
      <Container maxWidth="150ch" padding={8}>
        <Stack textAlign="center" gap={8}>
          <Heading as="h1">Treat!</Heading>
          <Text>
            Quick reference for outfits in the Kingdom of Loathing and what you
            get for wearing them while Trick-or-Treating.
          </Text>
          <OutfitTable
            outfits={outfits}
            prices={itemNameToPrice}
            loading={loading}
          />
        </Stack>
      </Container>
    </ChakraProvider>
  );
}

export default App;
