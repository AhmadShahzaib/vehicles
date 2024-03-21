import { Delete, HttpStatus, SetMetadata } from '@nestjs/common';

import { ApiBearerAuth, ApiParam, ApiResponse } from '@nestjs/swagger';

import {
  CombineDecorators,
  CombineDecoratorType,
  ErrorType,
  VEHICLES,
} from '@shafiqrathore/logeld-tenantbackend-common-future';

export default function DeleteDecorators() {
  const DeleteDecorators: Array<CombineDecoratorType> = [
    Delete(':id'),
    SetMetadata('permissions', [VEHICLES.DELETE]),
    ApiBearerAuth('access-token'),
    ApiResponse({ status: HttpStatus.OK }),
    ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorType }),
    ApiParam({
      name: 'id',
      description: 'The ID of the vehicle you want to delete.',
    }),
  ];
  return CombineDecorators(DeleteDecorators);
}
