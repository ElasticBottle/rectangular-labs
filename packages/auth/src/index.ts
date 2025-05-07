import { issuer } from "@openauthjs/openauth";
import { DiscordProvider } from "@openauthjs/openauth/provider/discord";
import { GithubProvider } from "@openauthjs/openauth/provider/github";
import { Select } from "@openauthjs/openauth/ui/select";
import { handle } from "hono/aws-lambda";
import { env } from "./env";
import { getUserProfile } from "./provider/get-profile";
import { subjects } from "./subject";

const authApp = issuer({
  subjects,
  select: Select({
    providers: {
      code: {
        display: "Code",
      },
      discord: {
        display: "Discord",
      },
      github: {
        display: "GitHub",
      },
    },
  }),
  providers: {
    github: GithubProvider({
      clientID: env().GITHUB_CLIENT_ID,
      clientSecret: env().GITHUB_CLIENT_SECRET,
      scopes: ["user:email", "read:user"],
      pkce: true,
      type: "code",
    }),
    discord: DiscordProvider({
      clientID: env().DISCORD_CLIENT_ID,
      clientSecret: env().DISCORD_CLIENT_SECRET,
      scopes: ["identify", "email"],
      pkce: true,
      type: "code",
    }),
  },
  theme: {
    title: "Galleo",
    primary: {
      dark: "#000000",
      light: "#FFFFFF",
    },
    radius: "sm",
    favicon: "https://dev.galleoai.com/galleo-favicon.svg",
    logo: "https://dev.galleoai.com/galleo-favicon.svg",
    font: {
      family: "Inter",
      scale: "1",
    },
  },
  success: async (ctx, value) => {
    const userProfileResult = await getUserProfile(value);

    if (!userProfileResult.ok) {
      console.error(
        "Failed to fetch user profile:",
        userProfileResult.error.message,
      );
      // Return an actual Response object for errors
      return new Response(
        `Failed to fetch user profile: ${userProfileResult.error.message}`,
        { status: 500 },
      );
    }

    const userProfile = userProfileResult.value;

    return ctx.subject("user", userProfile);
  },
});

export const handler = handle(authApp);
