window.Api = {
  async request(path, options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set("Accept", "application/json");
    if (options.body) headers.set("Content-Type", "application/json");

    const response = await fetch(path, {
      ...options,
      headers,
      credentials: "same-origin"
    });
    const payload = response.status === 204 ? null : await response.json();

    if (!response.ok) {
      const error = new Error(payload?.error || "The request could not be completed.");
      error.status = response.status;
      throw error;
    }
    return payload;
  }
};
