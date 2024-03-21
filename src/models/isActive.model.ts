import { IsBoolean, IS_ALPHA } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IsActive {
  @ApiProperty()
  @IsBoolean()
  isActive: boolean;
}
