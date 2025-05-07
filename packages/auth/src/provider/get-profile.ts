import type { Oauth2Token } from "@openauthjs/openauth/provider/oauth2";
import { type Result, err } from "@rectangular-labs/result";
import type { UserSubject } from "../subject";
import { getDiscordUser } from "./discord";
import { getGithubUser } from "./github";

export async function getUserProfile(value: {
  provider: "github" | "discord";
  tokenset: Oauth2Token;
}): Promise<Result<UserSubject, Error>> {
  switch (value.provider) {
    case "github":
      return await getGithubUser(value.tokenset.access);
    case "discord":
      return await getDiscordUser(value.tokenset?.access);
    default: {
      const _neverReached: never = value.provider;
      return err(new Error(`Unsupported provider: ${_neverReached}`));
    }
  }
}
