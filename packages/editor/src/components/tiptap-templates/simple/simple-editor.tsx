import { EditorContent, EditorContext, useEditor } from "@tiptap/react";
import * as React from "react";

import { Highlight } from "@tiptap/extension-highlight";
import { Image } from "@tiptap/extension-image";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { TaskItem } from "@tiptap/extension-task-item";
import { TaskList } from "@tiptap/extension-task-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Underline } from "@tiptap/extension-underline";
// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit";

// --- Custom Extensions ---
import { Link } from "../../tiptap-extension/link-extension";
import { Selection } from "../../tiptap-extension/selection-extension";
import { TrailingNode } from "../../tiptap-extension/trailing-node-extension";
import "../../tiptap-node/code-block-node/code-block-node.scss";
import "../../tiptap-node/list-node/list-node.scss";
import "../../tiptap-node/image-node/image-node.scss";
import "../../tiptap-node/paragraph-node/paragraph-node.scss";
import "../../tiptap-node/inline-suggestion-node/inline-suggestion.scss";

import { ThemeToggle } from "@rectangular-labs/ui/components/theme-provider";
// --- Tiptap UI ---
import { Button } from "@rectangular-labs/ui/components/ui/button";
import { Spacer } from "@rectangular-labs/ui/components/ui/spacer";
import { Toolbar } from "../../tiptap-ui-primitive/toolbar";
import { HeadingDropdownMenu } from "../../tiptap-ui/heading/heading-dropdown-menu";
import {
  LinkButton,
  LinkContent,
  LinkPopover,
} from "../../tiptap-ui/link-popover";
import { ListDropdownMenu } from "../../tiptap-ui/list/list-dropdown-menu";
import { MarkButton } from "../../tiptap-ui/mark-button";
import { NodeButton } from "../../tiptap-ui/node-button";
import { TextAlignButton } from "../../tiptap-ui/text-align-button";
import { UndoRedoButton } from "../../tiptap-ui/undo-redo-button";

// --- Icons ---
import { ArrowLeftIcon, HighlighterIcon, LinkIcon } from "../../icons";

// --- Hooks ---
import { useIsMobile } from "@rectangular-labs/ui/hooks/use-is-mobile";
import { useWindowSize } from "@rectangular-labs/ui/hooks/use-window-size";

// --- Styles ---
import "./simple-editor.scss";
import { Separator } from "@rectangular-labs/ui/components/ui/separator";
import { InlineSuggestion } from "../../tiptap-extension/inline-suggestion-extension";
import { LoroCRDT } from "../../tiptap-extension/loro-extension";

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
}: {
  onHighlighterClick: () => void;
  onLinkClick: () => void;
  isMobile: boolean;
}) => {
  return (
    <>
      <Spacer />

      <div className="flex h-full items-center gap-0.5">
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </div>

      <Separator orientation="vertical" className="h-10" />

      <div className="flex h-full items-center gap-0.5">
        <HeadingDropdownMenu levels={[1, 2, 3, 4]} />
        <ListDropdownMenu types={["bulletList", "orderedList", "taskList"]} />
        <NodeButton type="codeBlock" />
        <NodeButton type="blockquote" />
      </div>

      <Separator orientation="vertical" className="h-10" />

      <div className="flex h-full items-center gap-0.5">
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="code" />
        <MarkButton type="underline" />
        {/* {isMobile ? (
          <HighlighterButton onClick={onHighlighterClick} />
        ) : (
          <HighlightPopover />
        )} */}
        {isMobile ? <LinkButton onClick={onLinkClick} /> : <LinkPopover />}
      </div>

      <Separator orientation="vertical" className="h-10" />

      <div className="flex h-full items-center gap-0.5">
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </div>

      <Separator orientation="vertical" className="h-10" />

      <div className="flex h-full items-center gap-0.5">
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </div>

      <Separator orientation="vertical" className="h-10" />

      {/* <ToolbarGroup>
        <ImageUploadButton text="Add" />
      </ToolbarGroup> */}

      <Spacer />

      {isMobile && <Separator orientation="vertical" className="h-10" />}

      <div className="flex h-full items-center gap-0.5">
        <ThemeToggle variant="ghost" />
      </div>
    </>
  );
};

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter" | "link";
  onBack: () => void;
}) => (
  <>
    <div className="flex h-full items-center gap-0.5">
      <Button data-style="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </div>

    <Separator orientation="vertical" className="h-10" />

    <LinkContent />
    {/* {type === "highlighter" ? <HighlightContent /> : <LinkContent />} */}
  </>
);

export function SimpleEditor({
  onCompletion,
}: {
  onCompletion: (existingText: string) => Promise<string>;
}) {
  const isMobile = useIsMobile();
  const windowSize = useWindowSize();
  const [mobileView, setMobileView] = React.useState<
    "main" | "highlighter" | "link"
  >("main");
  const [rect, setRect] = React.useState<
    Pick<DOMRect, "x" | "y" | "width" | "height">
  >({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const toolbarRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const updateRect = () => {
      setRect(document.body.getBoundingClientRect());
    };

    updateRect();

    const resizeObserver = new ResizeObserver(updateRect);
    resizeObserver.observe(document.body);

    window.addEventListener("scroll", updateRect);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("scroll", updateRect);
    };
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
      },
    },
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
      Selection,
      // ImageUploadNode.configure({
      //   accept: "image/*",
      //   maxSize: MAX_FILE_SIZE,
      //   limit: 3,
      //   upload: handleImageUpload,
      //   onError: (error) => console.error("Upload failed:", error),
      // }),
      TrailingNode,
      Link.configure({ openOnClick: false }),
      LoroCRDT,
      InlineSuggestion.configure({
        fetchAutocompletion: onCompletion,
      }),
    ],
    // content: content,
  });

  React.useEffect(() => {
    const checkCursorVisibility = () => {
      if (!editor || !toolbarRef.current) return;

      const { state, view } = editor;
      if (!view.hasFocus()) return;

      const { from } = state.selection;
      const cursorCoords = view.coordsAtPos(from);

      if (windowSize.height < rect.height) {
        if (cursorCoords && toolbarRef.current) {
          const toolbarHeight =
            toolbarRef.current.getBoundingClientRect().height;
          const isEnoughSpace =
            windowSize.height - cursorCoords.top - toolbarHeight > 0;

          // If not enough space, scroll until the cursor is the middle of the screen
          if (!isEnoughSpace) {
            const scrollY =
              cursorCoords.top - windowSize.height / 2 + toolbarHeight;
            window.scrollTo({
              top: scrollY,
              behavior: "smooth",
            });
          }
        }
      }
    };

    checkCursorVisibility();
  }, [editor, rect.height, windowSize.height]);

  React.useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main");
    }
  }, [isMobile, mobileView]);

  return (
    <EditorContext.Provider value={{ editor }}>
      <div className="relative flex min-h-screen flex-col lg:pt-5">
        <Toolbar ref={toolbarRef} className="order-last md:order-first">
          {mobileView === "main" ? (
            <MainToolbarContent
              onHighlighterClick={() => setMobileView("highlighter")}
              onLinkClick={() => setMobileView("link")}
              isMobile={isMobile}
            />
          ) : (
            <MobileToolbarContent
              type={mobileView}
              onBack={() => setMobileView("main")}
            />
          )}
        </Toolbar>

        <div className="flex-1 overflow-y-auto content-wrapper">
          <EditorContent
            editor={editor}
            role="presentation"
            className="mx-auto w-full max-w-2xl px-4 py-6 sm:p-12"
          />
        </div>
      </div>
    </EditorContext.Provider>
  );
}
