const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!response.ok || (payload && payload.success === false)) {
    const message = payload?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload?.data ?? payload;
}

export const api = {
  health: () => request("/actuator/health"),

  register: (body) => request("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => request("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),

  getLocations: () => request("/api/locations"),

  getRooms: (params = {}) => {
    const usp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") usp.set(k, String(v));
    });
    return request(`/api/rooms${usp.toString() ? `?${usp}` : ""}`);
  },
  getRoomDetail: (roomId, token) => request(`/api/rooms/${roomId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  }),
  createRoom: (body, token) => request("/api/rooms", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { Authorization: `Bearer ${token}` }
  }),
  joinRoom: (roomId, body, token) => request(`/api/rooms/${roomId}/join`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { Authorization: `Bearer ${token}` }
  }),
  receiveParticipant: (roomId, participantUserId, token) => request(`/api/rooms/${roomId}/participants/${participantUserId}/receive`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  }),
  completeRoom: (roomId, token) => request(`/api/rooms/${roomId}/complete`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  }),

  createReview: (body, token) => request("/api/reviews", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { Authorization: `Bearer ${token}` }
  }),
  getPublicUserReviews: (userId) => request(`/api/reviews/users/${userId}`),

  getUser: (userId) => request(`/api/users/${userId}`),
  getHostedRooms: (userId) => request(`/api/users/${userId}/rooms/hosted`),
  getParticipatedRooms: (userId) => request(`/api/users/${userId}/rooms/participated`),
  getUserReviews: (userId) => request(`/api/users/${userId}/reviews`)
};
