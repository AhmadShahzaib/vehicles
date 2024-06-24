import { Put, HttpStatus, Patch, SetMetadata } from '@nestjs/common';

import { ApiBearerAuth, ApiParam, ApiResponse } from '@nestjs/swagger';

import {
  CombineDecorators,
  CombineDecoratorType,
  ErrorType,
  VEHICLES,
} from '@shafiqrathore/logeld-tenantbackend-common-future';
import { VehiclesResponse } from '../models/response.model';

export default function UpdateVINByIdDecorators() {
  const UpdateVINByIdDecorators: Array<CombineDecoratorType> = [
    Patch('/UpdateVIN'),
    SetMetadata('permissions', [VEHICLES.EDIT]),
    ApiBearerAuth('access-token'),
    ApiResponse({ status: HttpStatus.OK, type: VehiclesResponse }),
    ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorType }),
    ApiParam({
      name: 'id',
      description: 'The ID of the vehicle you want to update.',
    }),
  ];
  return CombineDecorators(UpdateVINByIdDecorators);
}
