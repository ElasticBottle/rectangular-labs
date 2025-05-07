import { keymap } from "@tiptap/pm/keymap";
import { Extension } from "@tiptap/react";
import { LoroDoc, type LoroMap } from "loro-crdt";

import {
  CursorAwareness,
  LoroCursorPlugin,
  LoroSyncPlugin,
  LoroUndoPlugin,
  redo,
  undo,
} from "loro-prosemirror";

const doc = new LoroDoc<{
  // biome-ignore lint/suspicious/noExplicitAny: this is a workaround to avoid type errors
  doc: LoroMap<any>;
  data: LoroMap<Record<string, unknown>>;
}>();
doc.subscribeLocalUpdates((update) => {
  console.log("update", update);
});
const awareness = new CursorAwareness(doc.peerIdStr);

export const LoroCRDT = Extension.create({
  name: "loro-crdt",
  addProseMirrorPlugins() {
    // Return the necessary Loro plugins for Tiptap integration
    return [
      // Specify the containerId to sync with the 'doc' map in LoroDoc
      LoroSyncPlugin({ doc }),
      LoroUndoPlugin({ doc }), // Provides collaborative undo/redo functionality
      keymap({
        // Maps keyboard shortcuts to Loro undo/redo actions
        "Mod-z": undo,
        "Mod-y": redo,
        "Mod-Shift-z": redo,
      }),
      LoroCursorPlugin(awareness, {}), // Manages cursor awareness among collaborators
    ];
  },
});
