export type Game = {
  id: number;
  title: string;
  price: number;
  description?: string;
  image?: string;
  genre?: string[];
  releaseDate?: string;
  rating?: number;
  publisher?: string;
  developer?: string;
  tags?: string[];
  features?: string[];
  languages?: string[];
  discount?: number;
  reviewsCount?: number;
  platform?: string[];
  isEarlyAccess?: boolean;
};

export type Purchase = {
  id: number;
  userId: number;
  gameId: number | null; // Null si ajout manuel
  status: 'wishlist' | 'to_play' | 'playing' | 'completed' | 'abandoned' | 'mastered';
  source: 'mist_store' | 'manual' | 'steam_import' | 'epic_import';
  platform?: string;
  launchPath?: string;
  customTitle?: string;
  notes?: string;
  customImage?: string;
  rating?: number;
  playTime?: number;
  startedAt?: string;
  completedAt?: string;
  isFavorite: boolean;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
};

export type User = {
  id: number;
  username: string;
  email: string;
  role?: 'user' | 'admin';
};

export type AuthResponse = {
  token: string;
  user: User;
};

export const fetcher = (url: string) => fetch(url).then(res => res.json());

const GATEWAY_URL = "http://localhost:3000/api";

// --- AUTH ---

export const registerUser = async (username: string, email: string, password: string): Promise<User> => {
  const res = await fetch(`${GATEWAY_URL}/user/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Registration failed");
  }
  return res.json();
};

export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  const res = await fetch(`${GATEWAY_URL}/user/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Login failed");
  }
  return res.json();
};

export const getCurrentUser = async (token: string): Promise<User> => {
  const res = await fetch(`${GATEWAY_URL}/user/me`, {
    method: "GET",
    headers: { 
      "Authorization": `Bearer ${token}` 
    },
  });

  if (!res.ok) {
     throw new Error("Failed to fetch user");
  }
  return res.json();
};

// --- STORE & LIBRARY ---

export const getGames = async (): Promise<Game[]> => {
  const res = await fetch(`${GATEWAY_URL}/store`);
  if (!res.ok) throw new Error("Failed to fetch games");
  return res.json();
}

export const getUserLibrary = async (userId: number): Promise<Purchase[]> => {
  const res = await fetch(`${GATEWAY_URL}/library/user/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch library");
  return res.json();
}

export const buyGame = async (userId: number, gameId: number): Promise<Purchase> => {
  const res = await fetch(`${GATEWAY_URL}/library/buy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, gameId }),
  });
  
  if (!res.ok) throw new Error("Failed to buy game");
  return res.json();
}

export const updateGameStatus = async (purchaseId: number, status: Purchase['status']): Promise<Purchase> => {
  const res = await fetch(`${GATEWAY_URL}/library/purchase/${purchaseId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) throw new Error("Failed to update status");
  return res.json();
}

export const updateGameRating = async (purchaseId: number, rating: number): Promise<Purchase> => {
  const res = await fetch(`${GATEWAY_URL}/library/purchase/${purchaseId}/rating`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ rating }),
  });

  if (!res.ok) throw new Error("Failed to update rating");
  return res.json();
}

export const toggleFavorite = async (purchaseId: number): Promise<Purchase> => {
  const res = await fetch(`${GATEWAY_URL}/library/purchase/${purchaseId}/favorite`, {
    method: "PATCH",
  });

  if (!res.ok) throw new Error("Failed to toggle favorite");
  return res.json();
}

export const updateGameNotes = async (purchaseId: number, notes: string): Promise<Purchase> => {
  const res = await fetch(`${GATEWAY_URL}/library/purchase/${purchaseId}/notes`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ notes }),
  });

  if (!res.ok) throw new Error("Failed to update notes");
  return res.json();
}

export const addManualGame = async (userId: number, data: {
  title: string;
  platform?: string;
  launchPath?: string;
  customImage?: string;
  status?: Purchase['status'];
  notes?: string;
}): Promise<Purchase> => {
  const res = await fetch(`${GATEWAY_URL}/library/add-manual`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, ...data }),
  });

  if (!res.ok) throw new Error("Failed to add manual game");
  return res.json();
}

export const getLibraryByStatus = async (userId: number, status: Purchase['status']): Promise<Purchase[]> => {
  const res = await fetch(`${GATEWAY_URL}/library/user/${userId}/status/${status}`);
  if (!res.ok) throw new Error("Failed to fetch library by status");
  return res.json();
}
