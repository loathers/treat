import {
  ChakraProvider,
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
      setOutfits((await loadOutfits())?.data ?? []);
      setItems((await loadItems())?.data ?? []);
      setPrices(await fetchPrices());
    }

    load();
  }, []);

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
    <ChakraProvider>
      <Container maxWidth="150ch" padding={8}>
        <Stack textAlign="center" spacing={8}>
          <Heading as="h1">Treat!</Heading>
          <Text>
            Quick reference for outfits in the Kingdom of Loathing and what you
            get for wearing them while Trick-or-Treating.
          </Text>
          <OutfitTable outfits={outfits} prices={itemNameToPrice} />
        </Stack>
      </Container>
    </ChakraProvider>
  );
}

export default App;
