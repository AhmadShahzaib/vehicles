import { Get, HttpStatus, SetMetadata } from '@nestjs/common';

import { ApiBearerAuth, ApiParam, ApiResponse } from '@nestjs/swagger';

import {
  CombineDecorators,
  CombineDecoratorType,
  VEHICLES,
} from '@shafiqrathore/logeld-tenantbackend-common-future';
import { VehiclesResponse } from '../models/response.model';

export default function GetByIdDecorators() {
  const GetByIdDecorators: Array<CombineDecoratorType> = [
    Get(':id'),
    SetMetadata('permissions', [VEHICLES.LIST]),
    ApiBearerAuth('access-token'),
    ApiResponse({ status: HttpStatus.OK, type: VehiclesResponse }),
    ApiParam({
      name: 'id',
      description: 'The ID of the vehicle you want to get.',
    }),
  ];
  return CombineDecorators(GetByIdDecorators);
}
