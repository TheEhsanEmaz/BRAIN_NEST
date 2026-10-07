async function getRegisteredCourses() {
  const result = await Api.request("/api/registrations");
  return result.courses;
}

async function registerCourse(courseId) {
  return Api.request("/api/registrations", {
    method: "POST",
    body: JSON.stringify({ courseId })
  });
}

async function dropCourse(courseId) {
  return Api.request(`/api/registrations/${encodeURIComponent(courseId)}`, {
    method: "DELETE"
  });
}
