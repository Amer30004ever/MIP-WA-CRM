import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { $Enums } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'admin@mavoid.com', description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass123!', description: 'Password (min 8 characters)' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ enum: $Enums.Role, example: $Enums.Role.AGENT, description: 'User role (defaults to AGENT)' })
  @IsOptional()
  @IsEnum($Enums.Role)
  role?: $Enums.Role;
}
