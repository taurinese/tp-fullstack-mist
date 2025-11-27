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
  gameId: number;
  createdAt: string;
  updatedAt: string;
};

export const fetcher = (url: string) => fetch(url).then(res => res.json());

const GATEWAY_URL = "http://localhost:3000/api";

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