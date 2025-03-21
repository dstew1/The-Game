import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, ShoppingBag, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

type MarketListing = {
  id: number;
  userId: number;
  price: number;
  listedAt: string;
  item: {
    id: number;
    name: string;
    description: string;
    rarity: "common" | "rare" | "epic" | "legendary";
    category: string;
  };
};

type InventoryItem = {
  id: number;
  userId: number;
  item: {
    id: number;
    name: string;
    description: string;
    rarity: "common" | "rare" | "epic" | "legendary";
    category: string;
  };
};

export default function MarketPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rarityFilter, setRarityFilter] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [listingPrice, setListingPrice] = useState<string>("");

  // Fetch market listings
  const { data: marketListings = [] } = useQuery<MarketListing[]>({
    queryKey: ["/api/market/listings"],
  });

  // Fetch user's inventory
  const { data: inventoryItems = [] } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  // List item mutation
  const { mutate: listItem } = useMutation({
    mutationFn: async ({ itemId, price }: { itemId: number; price: number }) => {
      const response = await fetch("/api/market/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, price }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/market/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({
        title: "Success",
        description: "Item listed successfully",
      });
      setSelectedItem(null);
      setListingPrice("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Buy item mutation
  const { mutate: buyItem } = useMutation({
    mutationFn: async (listingId: number) => {
      const response = await fetch(`/api/market/buy/${listingId}`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/market/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({
        title: "Success",
        description: "Item purchased successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Unlist item mutation
  const { mutate: unlistItem } = useMutation({
    mutationFn: async (listingId: number) => {
      const response = await fetch(`/api/market/unlist/${listingId}`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/market/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({
        title: "Success",
        description: "Item unlisted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleListItem = () => {
    if (!selectedItem || !listingPrice) return;
    
    const price = parseInt(listingPrice);
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid price",
        variant: "destructive",
      });
      return;
    }

    listItem({ itemId: selectedItem.item.id, price });
  };

  const filteredListings = marketListings.filter(listing => 
    rarityFilter === "all" || listing.item.rarity === rarityFilter
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/">
          <motion.div
            whileHover={{ x: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button variant="ghost" className="text-primary hover:text-primary/80 flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </motion.div>
        </Link>

        <Dialog>
          <DialogTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                List Item
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>List Item for Sale</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Select
                value={selectedItem?.id.toString() || ""}
                onValueChange={(value) => 
                  setSelectedItem(inventoryItems.find(item => item.id.toString() === value) || null)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an item" />
                </SelectTrigger>
                <SelectContent>
                  {inventoryItems.map((item) => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.item.name} ({item.item.rarity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Price in dreamcoins"
                value={listingPrice}
                onChange={(e) => setListingPrice(e.target.value)}
              />
              <Button onClick={handleListItem} className="w-full">
                List Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-black border-primary">
        <CardHeader>
          <CardTitle className="text-primary flex items-center justify-between">
            <span>Marketplace</span>
            <Select
              value={rarityFilter}
              onValueChange={setRarityFilter}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="common">Common</SelectItem>
                <SelectItem value="rare">Rare</SelectItem>
                <SelectItem value="epic">Epic</SelectItem>
                <SelectItem value="legendary">Legendary</SelectItem>
              </SelectContent>
            </Select>
          </CardTitle>
          <CardDescription className="text-gray-400">
            Buy and sell items with other entrepreneurs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredListings.map((listing) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="bg-black/50 border-primary/50">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-primary">{listing.item.name}</h3>
                            <p className="text-sm text-gray-400">{listing.item.description}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            listing.item.rarity === 'legendary' ? 'bg-yellow-500/20 text-yellow-500' :
                            listing.item.rarity === 'epic' ? 'bg-purple-500/20 text-purple-500' :
                            listing.item.rarity === 'rare' ? 'bg-blue-500/20 text-blue-500' :
                            'bg-gray-500/20 text-gray-500'
                          } capitalize`}>
                            {listing.item.rarity}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-1 text-primary">
                            <DollarSign className="h-4 w-4" />
                            <span>{listing.price}</span>
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              if (listing.userId === queryClient.getQueryData(["/api/user"])?.id) {
                                unlistItem(listing.id);
                              } else {
                                buyItem(listing.id);
                              }
                            }}
                          >
                            {listing.userId === queryClient.getQueryData(["/api/user"])?.id ? 'Unlist' : 'Buy'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
