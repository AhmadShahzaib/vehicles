import { Get, HttpStatus, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { sortableAttributes } from '../models';
import {
  CombineDecorators,
  CombineDecoratorType,
  VEHICLES,
} from '@shafiqrathore/logeld-tenantbackend-common-future';
import { VehiclesResponse } from '../models/response.model';

export default function GetDecorators() {
  const GetDecorators: Array<CombineDecoratorType> = [
    Get(),
    SetMetadata('permissions', [VEHICLES.LIST]),
    ApiBearerAuth('access-token'),
    ApiResponse({ status: HttpStatus.OK, type: VehiclesResponse }),
    ApiQuery({
      name: 'search',
      example: 'search by make ,model, vin etc',
      required: false,
    }),
    ApiQuery({
      name: 'orderBy',
      example: 'Field by which record will be ordered',
      required: false,
      enum: sortableAttributes,
    }),
    ApiQuery({
      name: 'orderType',
      example: 'Ascending(1),Descending(-1)',
      enum: [1, -1],
      required: false,
    }),
    ApiQuery({
      name: 'pageNo',
      example: '1',
      description: 'The pageNo you want to get e.g 1,2,3 etc',
      required: false,
    }),
  ];
  return CombineDecorators(GetDecorators);
}
