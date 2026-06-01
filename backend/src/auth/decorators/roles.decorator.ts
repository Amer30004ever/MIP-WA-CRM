import { SetMetadata } from '@nestjs/common';
import { $Enums } from '@prisma/client';

export const ROLES_KEY = 'roles';

/** Restrict a route to specific roles. e.g. @Roles($Enums.Role.ADMIN) */
export const Roles = (...roles: $Enums.Role[]) => SetMetadata(ROLES_KEY, roles);
