const projectsContainer = document.getElementById("projects-container");
const saveBtn = document.getElementById("save-btn");
const logoutBtn = document.getElementById("logout-btn");
const addProjectBtn = document.getElementById("add-project-button");

const LINE_JUMP = `
`;

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
  const {
    id,
    project_name,
    description,
    what_i_learned,
    img,
    git_link,
    live_demo_link,
  } = project;

  let projectContainer = document.createElement("div");
  projectContainer.classList.add("project");
  projectContainer.id = id;

  let nameContainer = document.createElement("textarea");
  let descriptionContainer = document.createElement("textarea");
  let whatILearnedContainer = document.createElement("textarea");
  let imgLinkContainer = document.createElement("textarea");
  let gitLinkContainer = document.createElement("textarea");
  let liveDemoLinkContainer = document.createElement("textarea");

  nameContainer.innerText = project_name;
  descriptionContainer.innerText = description.replaceAll("%n", LINE_JUMP);
  whatILearnedContainer.innerText = what_i_learned.replaceAll("%n", LINE_JUMP);
  imgLinkContainer.innerText = img;
  gitLinkContainer.innerText = git_link;
  liveDemoLinkContainer.innerText = live_demo_link;

  projectContainer.appendChild(nameContainer);
  projectContainer.appendChild(descriptionContainer);
  projectContainer.appendChild(whatILearnedContainer);
  projectContainer.appendChild(imgLinkContainer);
  projectContainer.appendChild(gitLinkContainer);
  projectContainer.appendChild(liveDemoLinkContainer);

  return projectContainer;
}

// save projects

function saveChanges() {
  let projects = projectsContainer.children;
  console.log(projects);

  for (let i = 0; i < projects.length; i++) {
    let project = projects[i];

    let { children } = project;

    let nameContainer = children[0];
    let descriptionContainer = children[1];
    let whatILearnedContainer = children[2];
    let imgLinkContainer = children[3];
    let gitLinkContainer = children[4];
    let liveDemoLinkContainer = children[5];

    let { id } = project;

    let name = nameContainer.value;
    let description = descriptionContainer.value.replaceAll(LINE_JUMP, "%n");
    let what_i_learned = whatILearnedContainer.value.replaceAll(
      LINE_JUMP,
      "%n"
    );
    let img = imgLinkContainer.value;
    let git_link = gitLinkContainer.value;
    let live_demo_link = liveDemoLinkContainer.value;

    let updatedProject = {
      id,
      name,
      description,
      what_i_learned,
      img,
      git_link,
      live_demo_link,
    };

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

function getValues(htmlArr) {
  const values = [];
  for (const html of htmlArr) {
    values.push(html.value);
  }
  return values;
}

function addProject() {
  const [name, description, what_i_learned, img, git_link, live_demo_link] =
    getValues(document.getElementById("new-project-container").children);

  if (
    !name ||
    !description ||
    !what_i_learned ||
    !img ||
    !git_link ||
    !live_demo_link
  )
    return alert("missing input field");

  fetch("/private-api/addProject", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      description,
      what_i_learned,
      img,
      git_link,
      live_demo_link,
    }),
  })
    .then((response) => response.json())
    .then((response) => {
      if (response.error) throw response.error;
      alert(response.ok);
    });
}

addProjectBtn.onclick = addProject;
