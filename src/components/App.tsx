import {
  ChakraProvider,
  Heading,
  Stack,
  Text,
  Container,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";

import {
  Outfit,
  Prices,
  fetchItems,
  fetchOutfits,
  fetchPrices,
} from "../client";
import { OutfitTable } from "./OutfitTable";

function App() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [items, setItems] = useState<
    Record<string, { id: number; tradeable: boolean }>
  >({});
  const [prices, setPrices] = useState<Prices>({});

  useEffect(() => {
    async function load() {
      setOutfits(await fetchOutfits());
      setItems(await fetchItems());
      setPrices(await fetchPrices());
    }

    load();
  }, []);

  const itemNameToPrice = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(items).map(([name, { id, tradeable }]) => [
          name,
          { ...prices[id], tradeable },
        ]),
      ),
    [items, prices],
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
