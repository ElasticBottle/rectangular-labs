import { backend } from "@/lib/backend";
import { SimpleEditor } from "@rectangular-labs/editor";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/editor")({
  component: RouteComponent,
});

function RouteComponent() {
  const onCompletion = async (existingText: string) => {
    const response = await backend.api.completion.$post({
      json: {
        context: existingText,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch completion");
    }
    const result = await response.json();
    console.log("result", result);
    return result.completion;
  };

  return <SimpleEditor onCompletion={onCompletion} />;
}
