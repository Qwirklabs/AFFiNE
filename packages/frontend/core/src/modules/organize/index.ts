import { DBService, type Framework, WorkspaceScope } from '@toeverything/infra';

import { Node } from './entities/node';
import { OrganizeService } from './services/organize';
import { FolderStore } from './stores/folder';

export { OrganizeService } from './services/organize';
export { OrganizeSidebarList } from './views/sidebar-list';

export function configureOrganizeModule(framework: Framework) {
  framework
    .scope(WorkspaceScope)
    .service(OrganizeService)
    .entity(Node, [FolderStore])
    .store(FolderStore, [DBService]);
}
