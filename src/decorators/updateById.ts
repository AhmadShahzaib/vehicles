import { Put, HttpStatus, SetMetadata } from '@nestjs/common';

import { ApiBearerAuth, ApiConsumes, ApiParam, ApiResponse } from '@nestjs/swagger';

import {
  CombineDecorators,
  CombineDecoratorType,
  ErrorType,
  VEHICLES,
} from '@shafiqrathore/logeld-tenantbackend-common-future';
import { VehiclesResponse } from '../models/response.model';

export default function UpdateByIdDecorators() {
  const UpdateByIdDecorators: Array<CombineDecoratorType> = [
    Put(':id'),
    SetMetadata('permissions', [VEHICLES.EDIT]),
    ApiConsumes('multipart/form-data'),
    ApiBearerAuth('access-token'),
    ApiResponse({ status: HttpStatus.OK, type: VehiclesResponse }),
    ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorType }),
    ApiParam({
      name: 'id',
      description: 'The ID of the vehicle you want to update.',
    }),
  ];
  return CombineDecorators(UpdateByIdDecorators);
}
