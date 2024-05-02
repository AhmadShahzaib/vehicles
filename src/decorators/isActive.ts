import { HttpStatus, Patch, SetMetadata } from '@nestjs/common';

import { ApiParam, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import {
  CombineDecorators,
  CombineDecoratorType,
  VEHICLES,
} from '@shafiqrathore/logeld-tenantbackend-common-future';
import { VehiclesResponse } from '../models/response.model';

export default function IsActiveDecorators() {
  const IsActiveDecorators: Array<CombineDecoratorType> = [
    Patch('/status/:id'),
    SetMetadata('permissions', [VEHICLES.DEACTIVATE]),
    ApiBearerAuth('access-token'),
    ApiResponse({ status: HttpStatus.OK, type: VehiclesResponse }),
    ApiParam({
      name: 'id',
      description: 'The ID of the Vehicle you want to change the status',
    }),
  ];
  return CombineDecorators(IsActiveDecorators);
}
