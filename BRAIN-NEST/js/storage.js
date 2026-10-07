const STORAGE_KEY = "registeredCourses";


function getRegisteredCourseIds() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}


function saveRegisteredCourseIds(idsArray) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(idsArray));
}


function registerCourse(courseId) {
  const ids = getRegisteredCourseIds();

  if (ids.includes(courseId)) {
    return { success: false, message: "You are already registered for this course." };
  }

  ids.push(courseId);
  saveRegisteredCourseIds(ids);
  return { success: true, message: "Course registered successfully!" };
}


function dropCourse(courseId) {
  let ids = getRegisteredCourseIds();
  ids = ids.filter(id => id !== courseId);
  saveRegisteredCourseIds(ids);
}