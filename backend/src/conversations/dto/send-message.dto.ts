import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({
    example: 'Hello, how can I help you today?',
    description: 'The body of the text message to send',
  })
  @IsNotEmpty()
  @IsString()
  content: string;
}
