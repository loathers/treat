import {
  ChakraProvider,
  defaultSystem,
  Heading,
  Stack,
  Text,
  Container,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";

import { Price } from "../client";
import { loadOutfitData, type Outfit } from "../data";
import { OutfitTable } from "./OutfitTable";

function App() {
  const [loading, setLoading] = useState(false);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [itemNameToPrice, setItemNameToPrice] = useState<
    Record<string, Price>
  >({});

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { outfits, itemNameToPrice } = await loadOutfitData();
      setOutfits(outfits);
      setItemNameToPrice(itemNameToPrice);
      setLoading(false);
    }

    load();
  }, []);

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
