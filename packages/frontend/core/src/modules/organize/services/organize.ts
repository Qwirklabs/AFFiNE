import { Service } from '@toeverything/infra';

import { Node } from '../entities/node';

export class OrganizeService extends Service {
  readonly rootFolder = this.framework.createEntity(Node, {
    id: null,
  });
}
