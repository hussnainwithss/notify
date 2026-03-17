import { UserStatus } from "./enums";

export interface UserModel {
  id: string;
  name: string;
  email: string;
  dateOfBirth: Date;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}
