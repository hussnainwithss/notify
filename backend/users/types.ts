import { UserRole, UserStatus } from "./enums";

export interface UserModel {
  id: string;
  name: string;
  email: string;
  dateOfBirth: Date;
  status: UserStatus;
  roles: UserRole[];
  createdAt: Date;
  updatedAt: Date;
}
