import { Entity, LiveData } from '@toeverything/infra';
import { map, of, switchMap } from 'rxjs';

import type { FolderStore } from '../stores/folder';

export class Node extends Entity<{
  id: string | null;
}> {
  id = this.props.id;

  info$ = LiveData.from<{
    data: string;
    // eslint-disable-next-line @typescript-eslint/ban-types
    type: (string & {}) | 'folder' | 'doc' | 'tag' | 'collection';
    index: string;
    id: string;
    parentId?: string | null;
  } | null>(this.store.watchNodeInfo(this.id ?? ''), null);
  type$ = this.info$.map(info =>
    this.id === null ? 'folder' : info?.type ?? ''
  );
  name$ = this.info$.map(info => (info?.type === 'folder' ? info.data : ''));
  children$ = LiveData.from<Node[]>(
    // watch children if this is a folder, otherwise return empty array
    this.type$
      .asObservable()
      .pipe(
        switchMap(type =>
          type === 'folder'
            ? this.store
                .watchNodeChildren(this.id)
                .pipe(
                  map(children =>
                    children
                      .filter(e => this.filterInvalidChildren(e))
                      .map(child => this.framework.createEntity(Node, child))
                  )
                )
            : of([])
        )
      ),
    []
  );
  index$ = this.info$.map(info => info?.index ?? '');

  constructor(readonly store: FolderStore) {
    super();
  }

  filterInvalidChildren(child: { type: string }): boolean {
    if (this.id === null && child.type !== 'folder') {
      return false; // root node can only have folders
    }
    return true;
  }

  createFolder(name: string) {
    if (this.type$.value !== 'folder') {
      throw new Error('Cannot create folder on non-folder node');
    }
    this.store.createFolder(this.id, name);
  }

  createLink(type: 'doc' | 'tag' | 'collection', targetId: string) {
    if (this.id === null) {
      throw new Error('Cannot create link on root node');
    }
    if (this.type$.value !== 'folder') {
      throw new Error('Cannot create link on non-folder node');
    }
    this.store.createLink(this.id, type, targetId);
  }

  removeChild(child: Node) {
    if (!child.id || !this.children$.value.some(e => e.id === child.id)) {
      throw new Error('Child not found');
    }
    if (child.type$.value === 'folder') {
      this.store.removeFolder(child.id);
    } else {
      this.store.removeLink(child.id);
    }
  }
}
