async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.detail || "Something went wrong.");
    error.status = response.status;
    throw error;
  }
  return data;
}

export const api = {
  me: () => request("/api/me"),
  login: (body) => request("/api/login", { method: "POST", body: JSON.stringify(body) }),
  register: (body) => request("/api/register", { method: "POST", body: JSON.stringify(body) }),
  logout: () => request("/api/logout", { method: "POST" }),
  courses: (q = "") => request(`/api/courses?q=${encodeURIComponent(q)}`),
  course: (id) => request(`/api/courses/${id}`),
  enroll: (id) => request(`/api/courses/${id}/enroll`, { method: "POST" }),
  lesson: (id) => request(`/api/lessons/${id}`),
  complete: (id) => request(`/api/lessons/${id}/complete`, { method: "POST" }),
  dashboard: () => request("/api/dashboard"),
  teach: () => request("/api/teach"),
  createCourse: (body) => request("/api/teach", { method: "POST", body: JSON.stringify(body) }),
  manage: (id) => request(`/api/teach/courses/${id}`),
  addLesson: (id, body) =>
    request(`/api/teach/courses/${id}/lessons`, { method: "POST", body: JSON.stringify(body) }),
};
