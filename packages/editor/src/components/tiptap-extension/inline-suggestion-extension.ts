import { Extension } from "@tiptap/react";

import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

declare module "@tiptap/react" {
  interface Commands<ReturnType> {
    inlineSuggestion: {
      /**
       * fetch inline suggestions
       */
      fetchSuggestion: () => ReturnType;
    };
  }
}

interface InlineSuggestionOptions {
  /**
   * fetch inline suggestions
   *
   * @param existingText -  existing text in the node
   * @returns {string} - the suggestion to be shown
   */
  fetchAutocompletion: (existingText: string) => Promise<string>;
}

interface InlineSuggestionStorage {
  data: {
    currentSuggestion?: string;
    nodeDetails?: {
      from: number;
      to: number;
    };
  };
}

export const InlineSuggestion = Extension.create<
  InlineSuggestionOptions,
  InlineSuggestionStorage
>({
  name: "inlineSuggestion",
  addOptions() {
    return {
      fetchAutocompletion: async () => {
        const message =
          "Please add a fetchSuggestion function to fetch suggestions from.";

        console.warn(message);

        return await Promise.resolve(message);
      },
    };
  },

  addStorage() {
    return {
      data: {},
    };
  },

  addCommands() {
    return {
      fetchSuggestion:
        () =>
        ({ state, chain, editor }) => {
          const { currentSuggestion } = this.storage.data;
          if (currentSuggestion) {
            return chain()
              .command(() => {
                this.storage.data = {};
                editor.chain().insertContent(currentSuggestion).focus().run();

                return true;
              })
              .run();
          }

          const { $from } = state.selection;

          const node = $from.parent;

          const [from, to] = [$from.start() - 1, $from.end() + 1];

          const existingText = node.textContent;

          if (existingText) {
            this.options.fetchAutocompletion(existingText).then((res) => {
              this.storage.data = {
                currentSuggestion: res,
                nodeDetails: {
                  from,
                  to,
                },
              };

              editor.view.dispatch(
                editor.view.state.tr.setMeta("addToHistory", false),
              );
            });

            return true;
          }

          return false;
        },
    };
  },

  addProseMirrorPlugins() {
    const getStorage = () => this.storage;

    const fetchSuggestion = () => this.editor.commands.fetchSuggestion();

    const handleNonTabKey = () => {
      this.storage.data = {};
    };

    return [
      new Plugin({
        key: new PluginKey("inlineSuggestion"),
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr) {
            const storage = getStorage().data;

            if (storage.currentSuggestion && storage.nodeDetails) {
              const { from, to } = storage.nodeDetails;

              const decoration = Decoration.node(from, to, {
                "data-inline-suggestion": storage.currentSuggestion,
              });

              return DecorationSet.create(tr.doc, [decoration]);
            }

            return DecorationSet.empty;
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
          handleKeyDown(_, event) {
            if (event.key === "Tab") {
              event.preventDefault();

              fetchSuggestion();

              return true;
            }

            handleNonTabKey();
            return false;
          },
        },
      }),
    ];
  },
});
