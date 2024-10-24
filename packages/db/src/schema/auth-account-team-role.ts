import { relations } from "drizzle-orm";
import { integer, primaryKey } from "drizzle-orm/sqlite-core";
import { sqlitePublicTable } from "./_table";
import { authAccountTable } from "./auth-account";
import { teamRoleTable } from "./team-role";

export const authAccountTeamRoleTable = sqlitePublicTable(
  "auth_account_team_role",
  {
    auth_account_id: integer()
      .notNull()
      .references(() => authAccountTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    team_role_id: integer()
      .notNull()
      .references(() => teamRoleTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    createdAt: integer({ mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    deletedAt: integer({ mode: "timestamp" }),
  },
  (table) => {
    return {
      primaryKey: primaryKey({
        columns: [table.auth_account_id, table.team_role_id],
      }),
    };
  },
);

export const authAccountTeamRoleRelations = relations(
  authAccountTeamRoleTable,
  ({ one }) => {
    return {
      authAccount: one(authAccountTable, {
        fields: [authAccountTeamRoleTable.auth_account_id],
        references: [authAccountTable.id],
      }),
      teamRole: one(teamRoleTable, {
        fields: [authAccountTeamRoleTable.team_role_id],
        references: [teamRoleTable.id],
      }),
    };
  },
);
