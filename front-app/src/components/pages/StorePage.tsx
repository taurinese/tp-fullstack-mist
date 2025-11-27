import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useSWR from "swr";
import { fetcher, type Game, buyGame } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { LoginModal } from "@/components/auth/LoginModal";

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
    return `http://localhost:3000/api/store${queryString ? `?${queryString}` : ""}`;
  };

  const { data: games, error, isLoading } = useSWR<Game[]>(buildUrl(), fetcher, {
    keepPreviousData: true, // Garde les données précédentes pendant le chargement
    revalidateOnFocus: false // Évite de recharger au focus
  });

  // Récupération des filtres disponibles
  const { data: availableGenres } = useSWR<string[]>(
    "http://localhost:3000/api/store/filters/genres",
    fetcher
  );
  const { data: availableTags } = useSWR<string[]>(
    "http://localhost:3000/api/store/filters/tags",
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
            {/* Prix */}
            <div>
              <h3 className="font-bold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Prix</h3>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  className="w-full rounded-none border-muted text-sm"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  className="w-full rounded-none border-muted text-sm"
                />
              </div>
            </div>

            {/* Promotions uniquement */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={onlyDiscount}
                  onChange={(e) => setOnlyDiscount(e.target.checked)}
                  className="cursor-pointer"
                />
                <span className="text-sm font-medium group-hover:text-foreground transition-colors">
                  Promotions uniquement
                </span>
              </label>
            </div>

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
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
                <option value="rating">Meilleure note</option>
                <option value="releaseDate">Plus récent</option>
                <option value="popular">Popularité</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {games.map((game) => (
              <Card key={game.id} className="group flex flex-col rounded-none border border-border hover:border-foreground transition-all duration-300 bg-card overflow-hidden p-0">
                <CardHeader className="p-0">
                   <div className="h-48 w-full relative overflow-hidden bg-muted">
                     <img 
                       src={game.image} 
                       alt={game.title} 
                       className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 grayscale group-hover:grayscale-0"
                     />
                     {game.discount > 0 && (
                       <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 text-xs font-bold">
                         -{game.discount}%
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
                    {game.discount > 0 ? (
                      <>
                        <span className="text-xs text-muted-foreground line-through">${game.price.toFixed(2)}</span>
                        <span className="font-mono font-bold text-green-600">
                          ${(game.price * (1 - game.discount / 100)).toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="font-mono font-bold">
                        {game.price === 0 ? "Gratuit" : `$${game.price.toFixed(2)}`}
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm" 
                    onClick={() => handleBuy(game)}
                    disabled={processingId === game.id}
                    className="rounded-none bg-foreground text-background hover:bg-muted hover:text-foreground border border-foreground"
                  >
                    {processingId === game.id ? "Achat..." : "Acheter"}
                  </Button>
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
