import { HttpStatus, Post, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  CombineDecorators,
  CombineDecoratorType,
  GetOperationId,
  ErrorType,
  VEHICLES,
} from '@shafiqrathore/logeld-tenantbackend-common-future';
import { VehiclesResponse } from '../models/response.model';

export default function AddDecorators() {
  const DeleteDecorators: Array<CombineDecoratorType> = [
    Post('add'),
    SetMetadata('permissions', [VEHICLES.ADD]),
    ApiConsumes('multipart/form-data'),
    ApiBearerAuth('access-token'),
    ApiResponse({ status: HttpStatus.CREATED, type: VehiclesResponse }),
    ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorType }),
    ApiOperation(GetOperationId('Vehicle', 'Add')),
  ];
  return CombineDecorators(DeleteDecorators);
}
