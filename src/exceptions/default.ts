import { HttpException } from '@/types/exceptions';

export const DefaultException: HttpException = {
  statusCode: 500,
  description: 'Internal server error.',
};
