import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsString,
  IsNumber,
  IsDate,
  IsMongoId,
} from 'class-validator';
import { Documents } from 'mongoDb/document/document';
import { Schema } from 'mongoose';

export class EditVehiclesRequest {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  make: string;

  @ApiPropertyOptional({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
  })
  vehicleDocument?: Express.Multer.File[];
  documents?: Documents[] = [];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  model: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  vehicleId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  modelYear: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  licensePlateNo: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  notes: string;

  tenantId?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  vinNo: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  fuelType: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  licensePlateIssueState: string;

  @ApiProperty()
  @IsString()
  @IsEnum(['mi', 'km'])
  odometerUnit: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  odometerReading: Number;

  @ApiProperty()
  @IsNotEmpty()
  readingDateTime: Date;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  inspectionForm: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  terminalName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  mainOfficeName: string;

  @ApiProperty()
  isActive: boolean;

  @IsOptional()
  @IsMongoId()
  eldId: string;

  currentEld: any;
}
