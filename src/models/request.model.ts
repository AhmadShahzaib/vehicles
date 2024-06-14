import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsEnum,
  IsOptional,
  NotEquals,
  IsMongoId,
  IsString,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { Documents } from 'mongoDb/document/document';
import { Schema } from 'mongoose';
export class VehiclesRequest {
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
  vehicleId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  model: string;

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
  licensePlateIssueState: string;

  @ApiProperty({
    type: String,
  })
  // @IsNotEmpty()
  @IsOptional()
  @IsMongoId()
  eldId: string;

  currentEld: any;

  @ApiProperty()
  @IsOptional()
  @IsString()
  notes: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  fuelType: string;

  tenantId?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  vinNo: string;

  @ApiProperty()
  @IsEnum(['mi', 'km'])
  @IsString()
  odometerUnit: string;

  @ApiProperty()
  @Transform(({ value }) => JSON.parse(value))
  @IsNotEmpty()
  @IsNumber()
  odometerReading: number;

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
  @Transform(({ value }) => JSON.parse(value))
  @IsOptional()
  @IsBoolean()
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Indicates whether the VIN is auto from mobile side',
    type: Boolean,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  @IsBoolean()
  autoFetchVinNo?: boolean;
}
