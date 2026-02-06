import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useSWR from "swr";
import { fetcher, GATEWAY_URL, type Game, buyGame, refreshGamePrices } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { LoginModal } from "@/components/auth/LoginModal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ExternalLink, Info } from "lucide-react";
import { toast } from "sonner"; // Import toast

export function StorePage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Nouveaux filtres avancés
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [onlyDiscount, setOnlyDiscount] = useState(false);
  const [sortBy, setSortBy] = useState("title");

  const { user } = useAuth();

  // Debounce pour éviter trop de requêtes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Construction de l'URL avec tous les filtres
  const buildUrl = () => {
    const params = new URLSearchParams();

    if (debouncedSearch) params.append("search", debouncedSearch);
    if (selectedGenres.length) params.append("genre", selectedGenres.join(","));
    if (selectedTags.length) params.append("tag", selectedTags.join(","));
    if (priceRange.min) params.append("minPrice", priceRange.min);
    if (priceRange.max) params.append("maxPrice", priceRange.max);
    if (onlyDiscount) params.append("onlyDiscount", "true");
    if (sortBy !== "title") params.append("sortBy", sortBy);

    const queryString = params.toString();
    return `${GATEWAY_URL}/store${queryString ? `?${queryString}` : ""}`;
  };

  const { data: games, error, isLoading, mutate } = useSWR<Game[]>(buildUrl(), fetcher, {
    keepPreviousData: true, // Garde les données précédentes pendant le chargement
    revalidateOnFocus: false // Évite de recharger au focus
  });

  // Récupération des filtres disponibles
  const { data: availableGenres } = useSWR<string[]>(
    `${GATEWAY_URL}/store/filters/genres`,
    fetcher
  );
  const { data: availableTags } = useSWR<string[]>(
    `${GATEWAY_URL}/store/filters/tags`,
    fetcher
  );

  if (error) return <div className="p-8 text-center text-red-500">Failed to load store.</div>;
  if (!games) return <div className="p-8 text-center">Loading store...</div>;

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedGenres([]);
    setSelectedTags([]);
    setPriceRange({ min: "", max: "" });
    setOnlyDiscount(false);
    setSortBy("title");
  };

  const handleMouseEnter = async (game: Game) => {
    // Avoid spamming refresh if recently updated (simple client-side check)
    if (game.lastPriceUpdate) {
       const lastUpdate = new Date(game.lastPriceUpdate).getTime();
       const now = new Date().getTime();
       if (now - lastUpdate < 3600000) return; // < 1 hour
    }

    try {
       // Optimistic UI update not needed here as we want real data, 
       // but we update local cache once data arrives
       const updatedGame = await refreshGamePrices(game.id);
       
       mutate(currentGames => {
          if (!currentGames) return [];
          return currentGames.map(g => g.id === game.id ? updatedGame : g);
       }, false); 
    } catch (e) {
       console.error("Price refresh failed", e);
    }
  };

  const handleAddToLibrary = async (game: Game) => {
    if (!user) {
      setLoginOpen(true);
      return;
    }

    try {
      setProcessingId(game.id);
      // Ici, on ne "buy" plus au sens transactionnel, on l'ajoute à la bibliothèque personnelle
      await buyGame(user.id, game.id); // buyGame est un peu mal nommé maintenant, c'est add to library
      toast.success(`Successfully added ${game.title} to your library!`);
      // Optional: Trigger a re-fetch of the library if we had a swr hook for it here
    } catch (err) {
      toast.error("Failed to add game to library. It might already be there.");
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
        <div className="max-w-md relative">
          <Input
            placeholder="Search games..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-none border-2 border-muted focus-visible:ring-0 focus-visible:border-foreground"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-foreground border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1">
        {/* Sidebar avec filtres dynamiques */}
        <aside className="w-64 border-r border-border p-6 hidden md:block overflow-y-auto">
          <div className="space-y-6">
            
            {/* Genres dynamiques */}
            {availableGenres && availableGenres.length > 0 && (
              <div>
                <h3 className="font-bold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Genres</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableGenres.map(genre => (
                    <label key={genre} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedGenres.includes(genre)}
                        onChange={() => toggleGenre(genre)}
                        className="cursor-pointer"
                      />
                      <span className="text-sm font-medium group-hover:text-foreground transition-colors">
                        {genre}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Tags dynamiques (afficher les plus populaires) */}
            {availableTags && availableTags.length > 0 && (
              <div>
                <h3 className="font-bold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {availableTags.slice(0, 15).map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-2 py-1 text-xs font-medium rounded-none border transition-colors ${
                        selectedTags.includes(tag)
                          ? "bg-foreground text-background border-foreground"
                          : "bg-background text-foreground border-border hover:border-foreground"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bouton Reset */}
            <Button
              onClick={resetFilters}
              variant="outline"
              className="w-full rounded-none border-2 hover:bg-foreground hover:text-background transition-colors"
            >
              Réinitialiser les filtres
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {/* Header avec compteur et tri */}
          <div className="mb-6 flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              <span className="font-bold text-foreground">{games.length}</span> jeu{games.length > 1 ? "x" : ""} trouvé{games.length > 1 ? "s" : ""}
              {(selectedGenres.length > 0 || selectedTags.length > 0 || onlyDiscount || priceRange.min || priceRange.max) && (
                <span className="ml-2">
                  ({selectedGenres.length + selectedTags.length + (onlyDiscount ? 1 : 0) + (priceRange.min || priceRange.max ? 1 : 0)} filtre{(selectedGenres.length + selectedTags.length + (onlyDiscount ? 1 : 0) + (priceRange.min || priceRange.max ? 1 : 0)) > 1 ? "s" : ""} actif{(selectedGenres.length + selectedTags.length + (onlyDiscount ? 1 : 0) + (priceRange.min || priceRange.max ? 1 : 0)) > 1 ? "s" : ""})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Trier par:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1 border-2 border-muted rounded-none bg-background text-foreground text-sm font-medium hover:border-foreground transition-colors cursor-pointer focus:outline-none focus:border-foreground"
              >
                <option value="title">Nom (A-Z)</option>
                <option value="rating">Meilleure note</option>
                <option value="releaseDate">Plus récent</option>
                <option value="popular">Popularité</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {games.map((game) => (
              <Card 
                key={game.id} 
                onMouseEnter={() => handleMouseEnter(game)}
                className="group flex flex-col rounded-none border border-border hover:border-foreground transition-all duration-300 bg-card overflow-hidden p-0"
              >
                <CardHeader className="p-0">
                   <div className="h-48 w-full relative overflow-hidden bg-muted">
                     <img 
                       src={game.image} 
                       alt={game.title} 
                       className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 grayscale group-hover:grayscale-0"
                     />
                     {game.bestDeal && game.bestDeal.savings && game.bestDeal.savings > 0 && (
                       <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 text-xs font-bold">
                         -{Math.round(game.bestDeal.savings)}%
                       </div>
                     )}
                   </div>
                </CardHeader>
                <CardContent className="flex-1 p-4">
                  <CardTitle className="text-lg font-bold line-clamp-1 mb-2" title={game.title}>{game.title}</CardTitle>
                  {game.genre && game.genre.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {game.genre.slice(0, 3).map(g => (
                        <span key={g} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 font-medium">
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
                  {game.tags && game.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {game.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-xs text-muted-foreground">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between items-center">
                  <div className="flex flex-col">
                    {game.bestDeal ? (
                      <>
                        {game.bestDeal.retailPrice > game.bestDeal.price && (
                          <span className="text-xs text-muted-foreground line-through">
                            ${game.bestDeal.retailPrice.toFixed(2)}
                          </span>
                        )}
                        <span className="font-mono font-bold text-lg text-green-600">
                          ${game.bestDeal.price.toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="font-mono font-bold text-sm text-muted-foreground">
                        Prix indisponible
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {game.allDeals && game.allDeals.length > 0 && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
                            <Info className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-60 p-2">
                          <p className="text-sm font-semibold mb-2">Autres offres:</p>
                          {game.allDeals.map((deal, index) => (
                            <div key={index} className="flex justify-between items-center text-xs py-1">
                              <span className="font-medium">{deal.store}</span>
                              <div className="flex items-center gap-1">
                                {deal.retailPrice > deal.price && (
                                   <span className="line-through text-muted-foreground">${deal.retailPrice.toFixed(2)}</span>
                                )}
                                <span className="font-bold">${deal.price.toFixed(2)}</span>
                                <a 
                                  href={deal.dealLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-primary hover:underline ml-1"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            </div>
                          ))}
                        </PopoverContent>
                      </Popover>
                    )}

                    <Button
                      size="sm" 
                      onClick={() => game.bestDeal && game.bestDeal.dealLink ? window.open(game.bestDeal.dealLink, '_blank') : handleAddToLibrary(game)}
                      disabled={processingId === game.id}
                      className="rounded-none bg-foreground text-background hover:bg-muted hover:text-foreground border border-foreground"
                    >
                      {processingId === game.id ? "..." : (game.bestDeal && game.bestDeal.dealLink ? "Voir l'offre" : "Ajouter à la bibliothèque")}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
            {games.length === 0 && (
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
