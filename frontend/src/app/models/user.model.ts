/** Source/AI-generated: Ocean Quest Chronicles Project (see docs/references.md) */
export interface PilotProfile {
  callsign: string;
  avatarUrl: string;
  country: string;
  level?: number;
  city: string;
  ip?: string;
}

export interface User {
  id: number | string;
  username: string;
  email: string;
  callsign?: string;
  country?: string;
  city?: string;
  highestLevel?: number;
  bestScore?: number;
  level1Best?: number;
  level2Best?: number;
  level3Best?: number;
  maxDepth?: number;
  totalRuns?: number;
  profile?: PilotProfile; // only present in /api/profile responses
}

/** Login / signup answer. No token: the identity lives in an HttpOnly session cookie. */
export interface AuthResponse {
  message: string;
  user: User;
}

export interface LeaderboardEntry {
  id?: number;
  userId: number | string;
  username: string;
  score: number;
  depthReached: number;
  chestsCollected: number;
  country: string;
  level?: number;
  createdAt?: string;
}
