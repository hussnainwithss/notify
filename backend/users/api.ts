import { api } from "encore.dev/api";
import { APIError, ErrCode } from "encore.dev/api";
import { db } from "./db";
import { UserModel } from "./types";
import { UserStatus } from "./enums";
import { userCreatedTopic } from "./events";

interface CreateUserReq {
  name: string;
  email: string;
  dateOfBirth: Date;
}

export const createUser = api(
  { method: "POST", path: "/users", expose: true },
  async (p: CreateUserReq): Promise<UserModel> => {
    const user: UserModel | null = await db.queryRow<UserModel>`
      INSERT INTO users (name, email, date_of_birth)
        VALUES (${p.name}, ${p.email}, ${p.dateOfBirth})
      ON CONFLICT (email) DO NOTHING
      RETURNING
        id,
        name,
        email,
        status,
        date_of_birth as "dateOfBirth",
        created_at as "createdAt",
        updated_at as "updatedAt";`;
    if (!user) {
      throw new APIError(
        ErrCode.AlreadyExists,
        "user already exists with this email",
      );
    }

    await userCreatedTopic.publish({
      userId: user.id,
      email: user.email,
      name: user.name,
      isActive: user.status === UserStatus.ACTIVE,
    });

    return user;
  },
);

export const getUsers = api(
  { method: "GET", path: "/users", expose: true },
  async (): Promise<{ users: UserModel[] }> => {
    const rows = db.query<UserModel>`
      SELECT id,
       name,
       email,
       status,
       date_of_birth as "dateOfBirth",
       created_at as "createdAt",
       updated_at as "updatedAt"
      FROM users;`;
    const users: UserModel[] = [];
    for await (const row of rows) {
      users.push(row);
    }
    return { users };
  },
);

export const getUser = api(
  { method: "GET", path: "/users/:id", expose: true },
  async ({ id }: { id: string }): Promise<UserModel> => {
    const user: UserModel | null = await db.queryRow<UserModel>`
       SELECT id,
        name,
        email,
        status,
        date_of_birth as "dateOfBirth",
        created_at as "createdAt",
        updated_at as "updatedAt"
       FROM users
        where id = ${id};`;
    if (!user) {
      throw new APIError(ErrCode.NotFound, "user not found");
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new APIError(ErrCode.NotFound, "inactive user");
    }

    return user;
  },
);
