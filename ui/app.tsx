import { MODE, MODE_FEATURES, VERSION } from '@datastation/shared/constants';
import { LANGUAGES } from '@datastation/shared/languages';
import log from '@datastation/shared/log';
import '@datastation/shared/polyfill';
import { DEFAULT_PROJECT, ProjectState } from '@datastation/shared/state';
import * as React from 'react';
import { Loading } from './components/Loading';
import { Dashboard } from './dashboard';
import { Editor } from './Editor';
import { Header } from './Header';
import { MakeSelectProject } from './MakeSelectProject';
import { NotFound } from './NotFound';
import { makeStore, ProjectContext, ProjectStore } from './ProjectStore';
import { Scheduler } from './scheduler';
import { UrlStateContext, useUrlState } from './urlState';

if (MODE === 'browser') {
  Object.values(LANGUAGES).map((l) => {
    if (l.inMemoryInit) {
      l.inMemoryInit();
    }
  });
}

function useProjectState(
  projectId: string,
  store: ProjectStore | null
): [ProjectState, (d: ProjectState) => void] {
  const [state, setProjectState] = React.useState<ProjectState>(null);

  function setState(newState: ProjectState, addToRestoreBuffer = true) {
    store.update(projectId, newState, addToRestoreBuffer);
    const c = { ...newState };
    Object.setPrototypeOf(c, ProjectState.prototype);
    setProjectState(c);
  }

  // Re-read state when projectId changes
  React.useEffect(() => {
    async function fetch() {
      let state;
      try {
        let rawState = await store.get(projectId);
        state = await ProjectState.fromJSON(rawState);
      } catch (e) {
        log.error(e);
      }

      state.projectName = projectId;
      state.lastVersion = VERSION;
      setProjectState(state);
    }

    if (projectId) {
      fetch();
    }
  }, [projectId]);

  return [state, setState];
}

const store = makeStore(MODE);

export function App() {
  const [urlState, setUrlState] = useUrlState();
  const [state, setProjectState] = useProjectState(urlState.projectId, store);
  React.useEffect(() => {
    if (!urlState.projectId && MODE_FEATURES.useDefaultProject) {
      setUrlState({ projectId: DEFAULT_PROJECT.projectName });
      setProjectState(DEFAULT_PROJECT);
    }
  });

  const [headerHeight, setHeaderHeightInternal] = React.useState(0);
  const setHeaderHeight = React.useCallback((e: HTMLElement) => {
    if (!e) {
      return;
    }

    setHeaderHeightInternal(e.offsetHeight);
  }, []);

  let MainChild =
    {
      editor: Editor,
      dashboard: Dashboard,
      scheduler: Scheduler,
    }[urlState.view || 'editor'] || NotFound;
  if (!urlState.projectId && !MODE_FEATURES.useDefaultProject) {
    MainChild = MakeSelectProject;
  }

  if (!state && urlState.projectId) {
    return <Loading />;
  }

  return (
    <ProjectContext.Provider value={{ state, setState: setProjectState }}>
      <UrlStateContext.Provider
        value={{ state: urlState, setState: setUrlState }}
      >
        <div className={`app app--${MODE}`}>
          {MODE_FEATURES.appHeader && (
            <Header setHeaderHeight={setHeaderHeight} />
          )}
          <main
            style={{
              marginTop: headerHeight,
              height: `calc(100% - ${headerHeight}px)`,
            }}
            className={'view-' + (urlState.view || 'editor')}
          >
            <MainChild />
          </main>
        </div>
      </UrlStateContext.Provider>
    </ProjectContext.Provider>
  );
}
