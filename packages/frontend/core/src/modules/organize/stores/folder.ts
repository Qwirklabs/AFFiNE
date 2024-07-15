import type { DBService } from '@toeverything/infra';
import { Store } from '@toeverything/infra';

export class FolderStore extends Store {
  constructor(private readonly dbService: DBService) {
    super();
  }

  watchNodeInfo(nodeId: string) {
    return this.dbService.db.folders.get$(nodeId);
  }

  watchNodeChildren(parentId: string | null) {
    return this.dbService.db.folders.find$({
      parentId: parentId === null ? null : parentId,
    });
  }

  createLink(
    parentId: string,
    type: 'doc' | 'tag' | 'collection',
    nodeId: string
  ) {
    const parent = this.dbService.db.folders.get(parentId);
    if (parent === null || parent.type !== 'folder') {
      throw new Error('Parent folder not found');
    }

    this.dbService.db.folders.create({
      id: nodeId,
      parentId,
      type,
      data: nodeId,
      index: '',
    });
  }

  createFolder(parentId: string | null, name: string) {
    if (parentId) {
      const parent = this.dbService.db.folders.get(parentId);
      if (parent === null || parent.type !== 'folder') {
        throw new Error('Parent folder not found');
      }
    }

    this.dbService.db.folders.create({
      parentId: parentId,
      type: 'folder',
      data: name,
      index: '',
    });
  }

  removeFolder(folderId: string) {
    const info = this.dbService.db.folders.get(folderId);
    if (info === null || info.type !== 'folder') {
      throw new Error('Folder not found');
    }
    const stack = [info];
    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) {
        continue;
      }
      if (current.type !== 'folder') {
        this.dbService.db.folders.delete(current.id);
      } else {
        const children = this.dbService.db.folders.where(
          e => e.parentId === current.id
        );
        stack.push(...children);
        this.dbService.db.folders.delete(current.id);
      }
    }
  }

  removeLink(linkId: string) {
    const link = this.dbService.db.folders.get(linkId);
    if (link === null || link.type === 'folder') {
      throw new Error('Link not found');
    }
    this.dbService.db.folders.delete(linkId);
  }
}
