const projectsContainer = document.getElementById("projects-container");
const newProjectContainer = document.getElementById("new-project-container");
const saveBtn = document.getElementById("save-btn");
const logoutBtn = document.getElementById("logout-btn");
const addProjectBtn = document.getElementById("add-project-button");

const LINE_JUMP = "\n";

// projects loading ans displaying

function removeChildren(htmlElement) {
  while (htmlElement.children[0])
    htmlElement.removeChild(htmlElement.firstChild);
}

function loadProjects() {
  removeChildren(projectsContainer);
  fetch("/api/getProjects")
    .then((response) => response.json())
    .then((response) => {
      if (response.error) throw response.error;
      displayProjects(response);
    })
    .catch((e) => console.error(e));
}

loadProjects();

function displayProjects(projects) {
  if (projects)
    for (const project of projects) {
      let html = createProjectHtml(project);
      projectsContainer.appendChild(html);
      projectsContainer.appendChild(document.createElement("hr"));
    }
}

function createProjectHtml(project) {
  let projectContainer = document.createElement("div");
  projectContainer.id = project.id + "-container";
  projectContainer.className = "project-container";

  for (const key in project) {
    if (key != "id") {
      const txtArea = document.createElement("textarea");
      txtArea.className = `${key}-textarea`;
      txtArea.placeholder = key;
      if (project[key])
        txtArea.innerHTML = project[key].replaceAll("%n", LINE_JUMP);
      projectContainer.appendChild(txtArea);
    }
  }

  const deleteBtn = document.createElement("div");
  deleteBtn.innerHTML = `
    <svg
      stroke="currentColor"
      fill="currentColor"
      stroke-width="0"
      viewBox="0 0 1024 1024"
      height="1em"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M360 184h-8c4.4 0 8-3.6 8-8v8h304v-8c0 4.4 3.6 8 8 8h-8v72h72v-80c0-35.3-28.7-64-64-64H352c-35.3 0-64 28.7-64 64v80h72v-72zm504 72H160c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h60.4l24.7 523c1.6 34.1 29.8 61 63.9 61h454c34.2 0 62.3-26.8 63.9-61l24.7-523H888c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zM731.3 840H292.7l-24.2-512h487l-24.2 512z"></path>
    </svg>
  `;
  deleteBtn.className = "delete-btn";
  deleteBtn.onclick = () => deleteProject(project.id);

  projectContainer.appendChild(deleteBtn);

  return projectContainer;
}

// save projects

function saveChanges() {
  let projects = projectsContainer.children;

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
  if (columns)
    for (const column of columns)
      if (column.Field != "id") {
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
    body: JSON.stringify({ newProject }),
  })
    .then((response) => response.json())
    .then((response) => {
      if (response.error) return console.log(response.error);
      loadProjects();
      alert(`${newProject.project_name} successfuly added to DB`);
    });
}

addProjectBtn.onclick = addProject;

const pop = document.getElementById("delete-confirm-pop");
const yesBtn = document.getElementById("yes-btn");
const noBtn = document.getElementById("no-btn");

noBtn.onclick = () => pop.classList.add("hidden");

function deleteProject(id) {
  pop.classList.remove("hidden");
  yesBtn.onclick = () => {
    fetch("/private-api/deleteProject", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    })
      .then((res) => res.json())
      .then((res) => {
        console.log(res);
        if (res.error) return alert("Error: " + res.error);
        loadProjects();
      });
    pop.classList.add("hidden");
  };
}

/////////////////////////////////////
