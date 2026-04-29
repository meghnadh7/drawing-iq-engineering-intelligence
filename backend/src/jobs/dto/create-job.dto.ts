import { IsOptional } from 'class-validator';

export class CreateJobDto {
  @IsOptional()
  filename?: string;
}
