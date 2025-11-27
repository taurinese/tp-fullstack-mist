import useSWR from "swr";
import { fetcher, getUserLibrary, getGames, type Game, type Purchase } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function LibraryPage() {
  const { user } = useAuth();

  // Fetch user's library purchases
  const { data: purchases, error: libraryError } = useSWR<Purchase[]>(
    user ? `library-user-${user.id}` : null,
    () => getUserLibrary(user!.id)
  );

  // Fetch all games to map details (since library service returns only IDs)
  const { data: allGames, error: gamesError } = useSWR<Game[]>(
    "all-games-library",
    getGames
  );

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <h2 className="text-2xl font-bold">Please log in to view your library</h2>
        <p className="text-muted-foreground">You need an account to track your game collection.</p>
      </div>
    );
  }

  if (libraryError || gamesError) {
    return <div className="p-8 text-center text-red-500">Failed to load library.</div>;
  }

  if (!purchases || !allGames) {
    return <div className="p-8 text-center">Loading library...</div>;
  }

  // Map purchases to full game details
  const ownedGames = purchases
    .map((p) => allGames.find((g) => g.id === p.gameId))
    .filter((g): g is Game => g !== undefined);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="px-8 py-12 border-b border-border">
        <h1 className="text-5xl font-bold tracking-tighter mb-4">My Library</h1>
        <p className="text-muted-foreground text-lg">
          You own {ownedGames.length} game{ownedGames.length !== 1 && "s"}.
        </p>
      </div>

      <main className="p-8">
        {ownedGames.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {ownedGames.map((game) => (
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
                  <CardTitle className="text-lg font-bold line-clamp-1">{game.title}</CardTitle>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Ready to Install</span>
                    <Button size="sm" variant="secondary" className="rounded-none">Install</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 space-y-6 text-center border border-dashed border-border rounded-lg bg-muted/20">
            <div className="text-xl font-medium">Your library is empty</div>
            <p className="text-muted-foreground max-w-md">
              It looks like you haven't purchased any games yet. 
              Visit the store to discover your next adventure.
            </p>
            <Link to="/store">
              <Button size="lg" className="rounded-none">Visit Store</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}