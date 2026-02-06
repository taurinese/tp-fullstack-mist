import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import useSWR from "swr";
import { getGames, buyGame, updateGameStatus, type Game } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ArrowRight, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";
import { LoginModal } from "@/components/auth/LoginModal";

export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loginOpen, setLoginOpen] = useState(false);

  const { data: games, error } = useSWR<Game[]>(
    "home-games",
    getGames
  );

  if (error) return <div className="p-8 text-center text-destructive">Failed to load games</div>;
  if (!games) return <div className="flex h-screen items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading experience...</div></div>;

  const featuredGame = games[0];
  const otherGames = games.slice(1);

  const handleAddToWishlist = async (game: Game) => {
    if (!user) {
      setLoginOpen(true);
      return;
    }
    try {
      const purchase = await buyGame(user.id, game.id);
      await updateGameStatus(purchase.id, 'wishlist');
      toast.success(`${game.title} added to your wishlist!`);
    } catch {
      toast.error("Failed to add to wishlist. It might already be in your library.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />

      {/* Hero Section */}
      {featuredGame && (
        <section className="relative h-[60vh] w-full overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-muted/20">
            <img
              src={featuredGame.image}
              alt={featuredGame.title}
              className="h-full w-full object-cover opacity-50 grayscale transition-all duration-1000 hover:scale-105 hover:grayscale-0"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          </div>

          <div className="container relative mx-auto flex h-full flex-col justify-end p-8 pb-16">
            <div className="max-w-2xl space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <span className="bg-primary/10 text-primary px-2 py-1 rounded-full">Featured</span>
                {featuredGame.genre && featuredGame.genre.length > 0 && (
                  <span className="text-muted-foreground">{featuredGame.genre.join(', ')}</span>
                )}
              </div>
              <h1 className="text-5xl font-extrabold tracking-tight lg:text-7xl">
                {featuredGame.title}
              </h1>
              <p className="text-lg text-muted-foreground">
                {featuredGame.description || "Discover this game on the MIST store."}
              </p>
              <div className="flex gap-4 pt-4">
                <Button size="lg" className="gap-2" onClick={() => navigate('/store')}>
                  Browse Store <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => handleAddToWishlist(featuredGame)}>
                  Add to Wishlist
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Latest Releases Grid */}
      <section className="container mx-auto p-8 py-16">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Latest Releases</h2>
          <Link to="/store">
            <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {otherGames.map((game) => (
            <Card key={game.id} className="group overflow-hidden rounded-lg border bg-card transition-all hover:shadow-lg p-0">
              <CardContent className="p-0">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img
                    src={game.image}
                    alt={game.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center justify-center">
                     <Button variant="secondary" className="translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100" onClick={() => navigate('/store')}>
                        View Details
                     </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col items-start gap-1 p-4">
                <h3 className="font-semibold leading-none tracking-tight">{game.title}</h3>
                <div className="flex w-full items-center justify-between text-sm text-muted-foreground">
                  <span>{game.genre && game.genre.length > 0 ? game.genre[0] : "Game"}</span>
                  {game.rating != null && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-primary text-primary" />
                      <span>{game.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
