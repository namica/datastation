import { ProjectState } from '@datastation/shared/state';
import fs from 'fs';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Dashboard } from '../ui/dashboard';
import { ProjectContext } from '../ui/ProjectStore';
import { UrlStateContext } from '../ui/urlState';

export function renderPage(project: ProjectState, pageId: string) {
  const page = project.pages.findIndex((p) => p.id === pageId);
  const view = (
    <ProjectContext.Provider value={{ state: project, setState: () => {} }}>
      <UrlStateContext.Provider
        value={{
          state: {
            page: page,
            projectId: project.projectName,
            view: 'dashboard',
          },
          setState: () => {},
        }}
      >
        <Dashboard />
      </UrlStateContext.Provider>
    </ProjectContext.Provider>
  );

  return `<!doctype html>
<html>
  <head>
    <style type="text/css">${fs.readFileSync('ui/style.css').toString()}</style>
  </head>
  <body>${renderToString(view)}</body>
</html>`;
}
