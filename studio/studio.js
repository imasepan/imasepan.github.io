const studioProjects = [
  {
    number: '01 / 01',
    name: 'PlayerMarket',
    description: 'Repository-backed project. Description pending confirmation.',
    stack: 'TECHNOLOGY METADATA PENDING',
    url: 'https://github.com/imasepan/PlayerMarket'
  }
];

const projectList = document.querySelector('#studio-projects');

if (projectList) {
  projectList.innerHTML = studioProjects.map((project) => `
    <article class="studio-project">
      <div class="project-glitch" aria-hidden="true"><span></span><span></span><span></span></div>
      <p class="project-number">${project.number}</p>
      <h2>${project.name}</h2>
      <p class="project-description">${project.description}</p>
      <p class="project-stack">${project.stack}</p>
      <a href="${project.url}" target="_blank" rel="noreferrer">VIEW REPOSITORY <span aria-hidden="true">↗</span></a>
    </article>
  `).join('');
}
