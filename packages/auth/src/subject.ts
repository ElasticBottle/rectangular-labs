import { createSubjects } from "@openauthjs/openauth/subject";
import { type } from "arktype";

export const subjects = createSubjects({
  user: type({
    id: "string",
    name: "string|null",
    email: "string|null",
    image: "string|null",
  }),
});
export type UserSubject = typeof subjects.user.infer;
