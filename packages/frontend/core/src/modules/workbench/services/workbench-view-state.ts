import {
  appInfo,
  TabViewsMetaKey,
  type TabViewsMetaSchema,
  tabViewsMetaSchema,
} from '@affine/electron-api';
import type { GlobalState } from '@toeverything/infra';
import { createIdentifier, LiveData, Service } from '@toeverything/infra';
import { nanoid } from 'nanoid';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';

export interface ViewMeta {
  id: string;
  /**
   * Path of the view
   */
  path?: {
    hash: string;
    pathname: string;
    search: string;
  };
  /**
   * Module name of the view (route path under workspaces/xxx)
   */
  moduleName?: 'trash' | 'all' | 'collection' | 'tag' | 'doc' | 'journal';
  /**
   * Title of the view. Not required for web.
   */
  title?: string;
}

export interface WorkbenchStateProvider {
  // not using LiveData for ease of side effect control on setting new values
  basename$: Observable<string>;
  basename: string;
  setBasename(basename: string): void;

  views$: Observable<ViewMeta[]>;
  views: ViewMeta[];
  setViews(views: ViewMeta[]): void;

  activeViewIndex$: Observable<number>;
  activeViewIndex: number;
  setActiveViewIndex(index: number): void;
}

export const WorkbenchStateProvider = createIdentifier<WorkbenchStateProvider>(
  'WorkbenchStateProvider'
);

export class InMemoryWorkbenchState
  extends Service
  implements WorkbenchStateProvider
{
  basename$ = new LiveData('/');
  get basename() {
    return this.basename$.value;
  }
  setBasename(basename: string) {
    this.basename$.next(basename);
  }

  // always have a default view
  views$ = new LiveData<ViewMeta[]>([
    {
      id: nanoid(),
    },
  ]);
  get views() {
    return this.views$.value;
  }
  setViews(views: ViewMeta[]) {
    this.views$.next(views);
  }

  activeViewIndex$ = new LiveData(0);
  get activeViewIndex() {
    return this.activeViewIndex$.value;
  }
  setActiveViewIndex(index: number) {
    this.activeViewIndex$.next(index);
  }
}

export class TabViewsMetaState extends Service {
  constructor(private readonly globalState: GlobalState) {
    super();
  }

  value$ = this.globalState.watch(TabViewsMetaKey).pipe(
    map(v => {
      return tabViewsMetaSchema.parse(v ?? {});
    })
  );

  set value(v: TabViewsMetaSchema) {
    this.globalState.set(TabViewsMetaKey, v);
  }

  get value() {
    return tabViewsMetaSchema.parse(
      this.globalState.get(TabViewsMetaKey) ?? {}
    );
  }

  patch(patch: Partial<TabViewsMetaSchema>) {
    this.value = {
      ...this.value,
      ...patch,
    };
  }
}

export class DesktopWorkbenchState
  extends Service
  implements WorkbenchStateProvider
{
  constructor(private readonly tabViewMeta: TabViewsMetaState) {
    super();
  }
  workbenchMeta$ = this.tabViewMeta.value$.pipe(
    map(v => {
      return v.workbenches.find(w => w.key === appInfo?.tabViewKey);
    })
  );

  workbenchMeta = this.tabViewMeta.value.workbenches.find(
    w => w.key === appInfo?.tabViewKey
  );

  setWorkbenchMeta(meta: TabViewsMetaSchema['workbenches'][number]) {
    this.tabViewMeta.patch({
      workbenches: this.tabViewMeta.value.workbenches.map(w =>
        w.key === appInfo?.tabViewKey ? meta : w
      ),
    });
  }

  patchWorkbenchMeta(
    patch: Partial<TabViewsMetaSchema['workbenches'][number]>
  ) {
    if (this.workbenchMeta) {
      this.setWorkbenchMeta({
        ...this.workbenchMeta,
        ...patch,
      });
    }
  }

  basename$ = this.workbenchMeta$.pipe(map(v => v?.basename ?? '/'));
  get basename() {
    return this.workbenchMeta?.basename ?? '/';
  }
  setBasename(basename: string) {
    this.patchWorkbenchMeta({ basename });
  }

  views$ = this.workbenchMeta$.pipe(map(v => v?.views ?? []));
  get views() {
    return this.workbenchMeta?.views ?? [];
  }
  setViews(views: ViewMeta[]) {
    this.patchWorkbenchMeta({ views });
  }

  activeViewIndex$ = this.workbenchMeta$.pipe(
    map(v => v?.activeViewIndex ?? 0)
  );
  get activeViewIndex() {
    return this.workbenchMeta?.activeViewIndex ?? 0;
  }
  setActiveViewIndex(index: number) {
    this.patchWorkbenchMeta({ activeViewIndex: index });
  }
}
