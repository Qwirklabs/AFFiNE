import { useLiveData, useServices } from '@toeverything/infra';

import { OrganizeService } from '../services/organize';

export const OrganizeSidebarList = () => {
  const { organizeService } = useServices({ OrganizeService });
  const rootFolder = organizeService.rootFolder;

  const folders = useLiveData(rootFolder.children$);

  return (
    <div>
      Organize
      <button
        onClick={() => {
          rootFolder.createFolder('New Folder');
        }}
      >
        +
      </button>
      <ul>
        {folders.map(folder => (
          <span key={folder.id}>
            <li key={folder.id}>
              {folder.name$.value}
              <button
                onClick={() => {
                  // eslint-disable-next-line unicorn/prefer-dom-node-remove
                  rootFolder.removeChild(folder);
                }}
              >
                -
              </button>
            </li>
          </span>
        ))}
      </ul>
    </div>
  );
};
