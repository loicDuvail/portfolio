const projectsContainer = document.getElementById("projects-container");
const newProjectContainer = document.getElementById("new-project-container");
const saveBtn = document.getElementById("save-btn");
const logoutBtn = document.getElementById("logout-btn");
const addProjectBtn = document.getElementById("add-project-button");

const LINE_JUMP = "\n";

// projects loading ans displaying

(function loadProjects() {
  fetch("/api/getProjects")
    .then((response) => response.json())
    .then((response) => {
      if (response.error) throw response.error;
      displayProjects(response);
    })
    .catch((e) => console.error(e));
})();

function displayProjects(projects) {
  if (projects)
    for (const project of projects) {
      let html = createProjectHtml(project);
      projectsContainer.appendChild(html);
    }
}

function createProjectHtml(project) {
  let projectContainer = document.createElement("div");
  projectContainer.id = project.id + "-container";

  for (const key in project) {
    if (key != "id") {
      const txtArea = document.createElement("textarea");
      txtArea.className = `${key}-textarea`;
      txtArea.placeholder = key;
      txtArea.innerHTML = project[key].replaceAll("%n", LINE_JUMP);
      projectContainer.appendChild(txtArea);
    }
  }

  return projectContainer;
}

// save projects

function saveChanges() {
  let projects = projectsContainer.children;
  console.log(projects);

  for (const project of projects) {
    let updatedProject = {};

    updatedProject.id = project.id.replace("-container", "");
    for (const textarea of project.children) {
      updatedProject[textarea.className.replace("-textarea", "")] =
        textarea.value.replaceAll(LINE_JUMP, "%n");
    }

    fetch("/private-api/updateProject", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ updatedProject }),
    });
  }
}

saveBtn.onclick = saveChanges;

// logout

function logout() {
  fetch("/private-api/logout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then(() => {
      window.location.replace("/");
    });
}

logoutBtn.onclick = logout;

// add new project

(async function generate_NewProjectMaker_Container() {
  const columns = await fetch("/api/getProjectsColumnNames").then((response) =>
    response.json()
  );
  console.log(columns);
  if (columns)
    for (const column of columns)
      if (column.field != "id") {
        const textarea = document.createElement("textarea");
        textarea.className = `${column.Field}-textarea`;
        textarea.placeholder = column.Field;
        newProjectContainer.appendChild(textarea);
      }
})();

function addProject() {
  let newProject = {};
  for (const textarea of newProjectContainer.children) {
    newProject[textarea.className.replace("-textarea", "")] =
      textarea.value.replaceAll(LINE_JUMP, "%n");
  }
  fetch("/private-api/addProject", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newProject),
  })
    .then((response) => response.json())
    .then((response) => {
      if (response.error) return console.log(response.error);
      alert(`${newProject.project_name} successfuly added to DB`);
    });
}

addProjectBtn.onclick = addProject;
