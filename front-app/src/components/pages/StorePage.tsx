import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useSWR from "swr";
import { fetcher, type Game, buyGame } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { LoginModal } from "@/components/auth/LoginModal";

export function StorePage() {
  const { data: games, error } = useSWR<Game[]>("http://localhost:3000/api/store", fetcher);
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  if (error) return <div className="p-8 text-center text-red-500">Failed to load store.</div>;
  if (!games) return <div className="p-8 text-center">Loading store...</div>;

  const filteredGames = games.filter((g) => g.title.toLowerCase().includes(search.toLowerCase()));

  const handleBuy = async (game: Game) => {
    if (!user) {
      setLoginOpen(true);
      return;
    }

    try {
      setProcessingId(game.id);
      await buyGame(user.id, game.id);
      alert(`Successfully purchased ${game.title}!`);
      // Optional: Trigger a re-fetch of the library if we had a swr hook for it here
    } catch (err) {
      alert("Failed to purchase game. It might already be in your library.");
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
      
      {/* Header Section */}
      <div className="px-8 py-12 border-b border-border">
        <h1 className="text-5xl font-bold tracking-tighter mb-4">Store</h1>
        <div className="max-w-md">
          <Input 
            placeholder="Search games..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-none border-2 border-muted focus-visible:ring-0 focus-visible:border-foreground"
          />
        </div>
      </div>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border p-8 hidden md:block">
          <div className="space-y-8">
            <div>
              <h3 className="font-bold mb-4 text-lg uppercase tracking-wider text-muted-foreground">Collections</h3>
              <ul className="space-y-3 text-sm font-medium">
                <li className="hover:text-muted-foreground cursor-pointer transition-colors">New Releases</li>
                <li className="hover:text-muted-foreground cursor-pointer transition-colors">Top Sellers</li>
                <li className="hover:text-muted-foreground cursor-pointer transition-colors">Coming Soon</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-lg uppercase tracking-wider text-muted-foreground">Genres</h3>
              <ul className="space-y-3 text-sm font-medium">
                <li className="hover:text-muted-foreground cursor-pointer transition-colors">Action</li>
                <li className="hover:text-muted-foreground cursor-pointer transition-colors">Adventure</li>
                <li className="hover:text-muted-foreground cursor-pointer transition-colors">RPG</li>
                <li className="hover:text-muted-foreground cursor-pointer transition-colors">Strategy</li>
                <li className="hover:text-muted-foreground cursor-pointer transition-colors">Simulation</li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGames.map((game) => (
              <Card key={game.id} className="group flex flex-col rounded-none border border-border hover:border-foreground transition-all duration-300 bg-card overflow-hidden p-0">
                <CardHeader className="p-0">
                   <div className="h-48 w-full relative overflow-hidden bg-muted">
                     <img 
                       src={game.image} 
                       alt={game.title} 
                       className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 grayscale group-hover:grayscale-0"
                     />
                   </div>
                </CardHeader>
                <CardContent className="flex-1 p-4">
                  <CardTitle className="text-lg font-bold line-clamp-1" title={game.title}>{game.title}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">Standard Edition</p> 
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between items-center">
                  <span className="font-mono font-bold">${game.price}</span>
                  <Button 
                    size="sm" 
                    onClick={() => handleBuy(game)}
                    disabled={processingId === game.id}
                    className="rounded-none bg-foreground text-background hover:bg-muted hover:text-foreground border border-foreground"
                  >
                    {processingId === game.id ? "Buying..." : "Buy Now"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
            {filteredGames.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No games found matching "{search}".
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
