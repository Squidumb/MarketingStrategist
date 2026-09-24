// Backend base URL — same endpoints as the original app.
export const API_BASE = "http://localhost:5001";

export const api = (path: string) => `${API_BASE}${path}`;
