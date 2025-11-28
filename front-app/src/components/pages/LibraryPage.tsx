import { useState } from "react";
import useSWR, { mutate } from "swr";
import {
  getUserLibrary,
  getGames,
  updateGameStatus,
  updateGameRating,
  updateGameNotes,
  toggleFavorite,
  fetchSteamLibrary, // New import
  importSteamGames, // New import
  type Game,
  type Purchase,
  type SteamGame // New import
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { toast } from "sonner"; // Import toast

const STATUS_LABELS = {
  wishlist: "Wishlist",
  to_play: "To Play",
  playing: "Playing",
  completed: "Completed",
  abandoned: "Abandoned",
  mastered: "Mastered"
} as const;

const STATUS_COLORS = {
  wishlist: "text-yellow-500",
  to_play: "text-blue-500",
  playing: "text-green-500",
  completed: "text-purple-500",
  abandoned: "text-red-500",
  mastered: "text-amber-500"
} as const;

export function LibraryPage() {
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<Purchase['status'] | 'all'>('all');
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  
  // --- STEAM IMPORT STATE ---
  const [showSteamImport, setShowSteamImport] = useState(false);
  const [steamId, setSteamId] = useState("");
  const [importedGames, setImportedGames] = useState<SteamGame[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const [editForm, setEditForm] = useState({
    status: '' as Purchase['status'],
    rating: 0,
    notes: '',
    platform: '',
    customTitle: '',
    customImage: '',
    launchPath: ''
  });

  // Fetch user's library purchases
  const { data: purchases, error: libraryError } = useSWR<Purchase[]>(
    user ? `library-user-${user.id}` : null,
    () => getUserLibrary(user!.id)
  );

  // Fetch all games to map details
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

  // Filtrer par statut
  const filteredPurchases = selectedStatus === 'all'
    ? purchases
    : purchases.filter(p => p.status === selectedStatus);

  // Compter par statut
  const statusCounts = purchases.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {} as Record<Purchase['status'], number>);

  // Handler pour toggle favori
  const handleToggleFavorite = async (purchaseId: number) => {
    try {
      await toggleFavorite(purchaseId);
      mutate(`library-user-${user.id}`);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  // Handler pour ouvrir la modal d'édition
  const handleOpenEdit = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setEditForm({
      status: purchase.status || 'to_play',
      rating: purchase.rating || 0,
      notes: purchase.notes || '',
      platform: purchase.platform || '',
      customTitle: purchase.customTitle || '',
      customImage: purchase.customImage || '',
      launchPath: purchase.launchPath || ''
    });
  };

  // Handler pour fermer la modal
  const handleCloseEdit = () => {
    setEditingPurchase(null);
  };

  // Handler pour sauvegarder les modifications
  const handleSaveEdit = async () => {
    if (!editingPurchase) return;

    try {
      // Mettre à jour le statut
      if (editForm.status !== editingPurchase.status) {
        await updateGameStatus(editingPurchase.id, editForm.status);
      }

      // Mettre à jour le rating
      if (editForm.rating !== editingPurchase.rating) {
        await updateGameRating(editingPurchase.id, editForm.rating);
      }

      // Mettre à jour les notes
      if (editForm.notes !== editingPurchase.notes) {
        await updateGameNotes(editingPurchase.id, editForm.notes);
      }

      // Revalider les données
      mutate(`library-user-${user.id}`);
      handleCloseEdit();
      toast.success('Changes saved successfully');
    } catch (error) {
      console.error('Failed to save changes:', error);
      toast.error('Failed to save changes');
    }
  };

  // --- STEAM IMPORT HANDLER ---
  const handleImportSteam = async () => {
    if (!steamId) return;
    setIsImporting(true);
    try {
      const data = await fetchSteamLibrary(steamId);
      setImportedGames(data.games);
    } catch (error) {
      console.error("Import failed", error);
      toast.error("Failed to fetch Steam library. Is the ID correct?");
    } finally {
      setIsImporting(false);
    }
  };

  const handleAddImportedGames = async () => {
      if (!user || importedGames.length === 0) return;

      try {
          const result = await importSteamGames(user.id, importedGames);
          toast.success(`Success! ${result.count} games imported to your library.`);
          
          // Refresh library
          mutate(`library-user-${user.id}`);
          
          setShowSteamImport(false);
          setImportedGames([]);
          setSteamId("");
      } catch (error) {
          console.error("Failed to save imported games", error);
          toast.error("Failed to import games into library.");
      }
  };

  // Combiner purchases avec game details
  const enrichedPurchases = filteredPurchases.map(purchase => {
    const game = purchase.gameId ? allGames.find(g => g.id === purchase.gameId) : null;
    // Assurer qu'il y a toujours un statut (défaut: to_play)
    const normalizedPurchase = {
      ...purchase,
      status: purchase.status || 'to_play' as Purchase['status']
    };
    return { purchase: normalizedPurchase, game };
  });

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="px-8 py-12 border-b border-border flex justify-between items-center">
        <div>
            <h1 className="text-5xl font-bold tracking-tighter mb-4">My Library</h1>
            <p className="text-muted-foreground text-lg">
            {purchases.length} game{purchases.length !== 1 ? "s" : ""} in your collection
            </p>
        </div>
        <Button onClick={() => setShowSteamImport(true)} variant="outline" className="rounded-none border-2">
            Import from Steam
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="border-b border-border">
        <div className="px-8 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
              selectedStatus === 'all'
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            All ({purchases.length})
          </button>
          {Object.entries(STATUS_LABELS).map(([status, label]) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status as Purchase['status'])}
              className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
                selectedStatus === status
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {label} ({statusCounts[status as Purchase['status']] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="p-8">
        {enrichedPurchases.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {enrichedPurchases.map(({ purchase, game }) => {
              const title = purchase.customTitle || game?.title || 'Unknown Game';
              const image = purchase.customImage || game?.image;

              return (
                <Card
                  key={purchase.id}
                  className="group flex flex-col rounded-none border border-border hover:border-foreground transition-all duration-300 bg-card overflow-hidden p-0 relative"
                >
                  {/* Badge favori */}
                  {purchase.isFavorite && (
                    <div className="absolute top-2 right-2 z-10 bg-yellow-500 text-white px-2 py-1 text-xs font-bold">
                      ★ FAVORITE
                    </div>
                  )}

                  <CardHeader className="p-0">
                    <div className="h-48 w-full relative overflow-hidden bg-muted">
                      {image ? (
                        <img
                          src={image}
                          alt={title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 grayscale group-hover:grayscale-0"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          No Image
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CardTitle className="text-lg font-bold line-clamp-1" title={title}>
                        {title}
                      </CardTitle>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleToggleFavorite(purchase.id)}
                          className="text-xl hover:scale-110 transition-transform"
                        >
                          {purchase.isFavorite ? '★' : '☆'}
                        </button>
                        <button
                          onClick={() => handleOpenEdit(purchase)}
                          className="text-muted-foreground hover:text-foreground transition-colors p-1"
                          title="Edit details"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                            <path d="m15 5 4 4"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Plateforme (si jeu manuel) */}
                    {purchase.platform && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {purchase.platform}
                      </p>
                    )}

                    {/* Source badge */}
                    {purchase.source !== 'mist_store' && (
                      <div className="inline-block text-xs bg-muted px-2 py-1 mb-2">
                        {purchase.source === 'manual' ? 'Added manually' : purchase.source}
                      </div>
                    )}

                    {/* Badge de statut cliquable */}
                    <button
                      onClick={() => handleOpenEdit(purchase)}
                      className={`mt-3 w-full px-3 py-2 text-sm font-medium border-2 transition-all hover:scale-[1.02] ${STATUS_COLORS[purchase.status]} border-current bg-background/50 hover:bg-current/10`}
                    >
                      {STATUS_LABELS[purchase.status]}
                    </button>

                    {/* Rating */}
                    {purchase.rating !== null && purchase.rating !== undefined && purchase.rating > 0 && (
                      <div className="mt-3 flex gap-1 justify-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className="text-yellow-500 text-sm">
                            {i < purchase.rating! ? '★' : '☆'}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Notes preview */}
                    {purchase.notes && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground italic line-clamp-2">
                          "{purchase.notes}"
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 space-y-6 text-center border border-dashed border-border rounded-lg bg-muted/20">
            <div className="text-xl font-medium">
              {selectedStatus === 'all'
                ? 'Your library is empty'
                : `No games in "${STATUS_LABELS[selectedStatus as Purchase['status']]}"`
              }
            </div>
            <p className="text-muted-foreground max-w-md">
              {selectedStatus === 'all' ? (
                <>
                  It looks like you haven't purchased any games yet.
                  Visit the store to discover your next adventure.
                </>
              ) : (
                <>Try a different status or add games from the store.</>
              )}
            </p>
            <Link to="/store">
              <Button size="lg" className="rounded-none">Visit Store</Button>
            </Link>
          </div>
        )}
      </main>

      {/* Modal Steam Import */}
      <Dialog open={showSteamImport} onOpenChange={setShowSteamImport}>
        <DialogContent className="sm:max-w-[600px] rounded-none">
          <DialogHeader>
            <DialogTitle>Import from Steam</DialogTitle>
            <DialogDescription>
              Enter your Steam ID (64-bit) to import your public game library.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-2 my-4">
            <Input 
                placeholder="Enter Steam ID (e.g. 76561198000000000)" 
                value={steamId}
                onChange={(e) => setSteamId(e.target.value)}
                className="rounded-none"
            />
            <Button onClick={handleImportSteam} disabled={isImporting} className="rounded-none">
                {isImporting ? "Scanning..." : "Scan"}
            </Button>
          </div>

          {importedGames.length > 0 && (
              <div className="mt-4 border rounded p-4 max-h-[300px] overflow-y-auto bg-muted/10">
                  <h3 className="font-bold mb-2">{importedGames.length} Games Found:</h3>
                  <ul className="space-y-2">
                      {importedGames.map(game => (
                          <li key={game.id} className="flex items-center gap-2 text-sm">
                              <img src={game.image} className="w-8 h-8 object-cover" />
                              <span className="flex-1 truncate">{game.title}</span>
                              <span className="text-muted-foreground text-xs">{Math.round(game.playtime / 60)}h played</span>
                          </li>
                      ))}
                  </ul>
                  <Button onClick={handleAddImportedGames} className="w-full mt-4 rounded-none">
                      Import {importedGames.length} Games
                  </Button>
              </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal d'édition */}
      <Dialog open={!!editingPurchase} onOpenChange={(open) => !open && handleCloseEdit()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-none">

          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Edit Game Details</DialogTitle>
            <DialogDescription>
              Update information about this game in your library
            </DialogDescription>
          </DialogHeader>

          {editingPurchase && (
            <div className="space-y-6 mt-4">
              {/* Titre (si jeu manuel) */}
              {editingPurchase.source === 'manual' && (
                <div className="space-y-2">
                  <Label htmlFor="customTitle">Game Title</Label>
                  <Input
                    id="customTitle"
                    value={editForm.customTitle}
                    onChange={(e) => setEditForm({ ...editForm, customTitle: e.target.value })}
                    placeholder="Enter game title"
                    className="rounded-none"
                  />
                </div>
              )}

              {/* Statut */}
              <div className="space-y-3">
                <Label>Status</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, status: value as Purchase['status'] })}
                      className={`px-4 py-3 text-sm font-medium border-2 transition-all ${
                        editForm.status === value
                          ? `${STATUS_COLORS[value as Purchase['status']]} border-current bg-current/10`
                          : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div className="space-y-2">
                <Label>Your Rating</Label>
                <div className="flex gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, rating: i + 1 })}
                      className="text-3xl hover:scale-110 transition-transform"
                    >
                      {i < editForm.rating ? '★' : '☆'}
                    </button>
                  ))}
                  {editForm.rating > 0 && (
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, rating: 0 })}
                      className="ml-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Plateforme */}
              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Input
                  id="platform"
                  value={editForm.platform}
                  onChange={(e) => setEditForm({ ...editForm, platform: e.target.value })}
                  placeholder="e.g., Steam, Epic Games, GOG"
                  className="rounded-none"
                />
              </div>

              {/* Launch Path */}
              <div className="space-y-2">
                <Label htmlFor="launchPath">Launch Path / URL</Label>
                <Input
                  id="launchPath"
                  value={editForm.launchPath}
                  onChange={(e) => setEditForm({ ...editForm, launchPath: e.target.value })}
                  placeholder="e.g., steam://rungameid/730 or C:\Games\..."
                  className="rounded-none"
                />
                <p className="text-xs text-muted-foreground">
                  Use deep links (steam://, com.epicgames.launcher://) or executable paths
                </p>
              </div>

              {/* Custom Image URL */}
              {editingPurchase.source === 'manual' && (
                <div className="space-y-2">
                  <Label htmlFor="customImage">Custom Image URL</Label>
                  <Input
                    id="customImage"
                    value={editForm.customImage}
                    onChange={(e) => setEditForm({ ...editForm, customImage: e.target.value })}
                    placeholder="https://..."
                    className="rounded-none"
                  />
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Your personal notes about this game..."
                  rows={4}
                  className="w-full px-3 py-2 border border-border rounded-none bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleCloseEdit}
                  className="rounded-none"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  className="rounded-none bg-foreground text-background hover:bg-muted hover:text-foreground"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}