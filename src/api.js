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
  askToJoin: (id, note) =>
    request(`/api/courses/${id}/join-request`, { method: "POST", body: JSON.stringify({ note }) }),
  admin: () => request("/api/admin"),
  decideRequest: (id, status) =>
    request(`/api/admin/requests/${id}`, { method: "POST", body: JSON.stringify({ status }) }),
  lesson: (id) => request(`/api/lessons/${id}`),
  complete: (id) => request(`/api/lessons/${id}/complete`, { method: "POST" }),
  runCode: (id, code) =>
    request(`/api/lessons/${id}/run`, { method: "POST", body: JSON.stringify({ code }) }),
  dashboard: () => request("/api/dashboard"),
  home: () => request("/api/home"),
  journey: () => request("/api/journey"),
  questions: (params) => {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    if (params.courseId) query.set("course_id", params.courseId);
    if (params.topic) query.set("topic", params.topic);
    return request(`/api/questions?${query.toString()}`);
  },
  solve: (id) => request(`/api/questions/${id}/solve`, { method: "POST" }),
  exams: () => request("/api/exams"),
  exam: (id) => request(`/api/exams/${id}`),
  submitExam: (id, answers) =>
    request(`/api/exams/${id}/submit`, { method: "POST", body: JSON.stringify({ answers }) }),
  teach: () => request("/api/teach"),
  createCourse: (body) => request("/api/teach", { method: "POST", body: JSON.stringify(body) }),
  manage: (id) => request(`/api/teach/courses/${id}`),
  addLesson: (id, body) =>
    request(`/api/teach/courses/${id}/lessons`, { method: "POST", body: JSON.stringify(body) }),
};
